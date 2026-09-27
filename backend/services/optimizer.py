"""
Optimizer Service — Bridges backend DB data to block_planner pipeline.

Flow:
  1. DB Defects → block_planner.MaintenanceTask
  2. DB Sections → block_planner.Section
  3. run_criticality_pipeline() → scored tasks + SuperTask clusters
  4. solve_schedule() → ScheduleResult with ScheduledBlock placements
  5. Convert back → BlockWindow + PackedTask ORM objects
"""
import sys
import math
import json
from pathlib import Path
from dataclasses import dataclass, field
from datetime import datetime, timedelta

import numpy as np

# Ensure block_planner is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from block_planner.models import (
    Department as BPDepartment,
    MaintenanceTask,
    PossessionType,
    Section as BPSection,
)
from block_planner.criticality import run_criticality_pipeline
from block_planner.scheduler import solve_schedule
from block_planner.data_gen import build_availability, LAMBDA_BY_TYPE


# ── Department mapping: backend (TMS/SMMS/TDMS) ↔ block_planner enum ──

DEPT_TO_BP = {
    "TMS": BPDepartment.ENGINEERING,
    "SMMS": BPDepartment.SNT,
    "TDMS": BPDepartment.TD,
}

DEPT_FROM_BP = {v: k for k, v in DEPT_TO_BP.items()}

POSS_MAP = {
    "track": PossessionType.TRACK,
    "ohe": PossessionType.OHE,
    "signal": PossessionType.SIGNAL,
    "combined": PossessionType.COMBINED,
}

# Map defect categories to block_planner's defect_type keys (for hazard λ lookup)
DEFECT_TYPE_MAP = {
    "Rail Fracture": "rail_fracture",
    "Loose Fitting": "loose_fitting",
    "Weld Defect": "weld_defect",
    "Ballast Packing": "rail_fracture",
    "Gauge Variation": "loose_fitting",
    "Rail Wear": "weld_defect",
    "Point Machine": "point_machine",
    "Track Circuit": "track_circuit",
    "Signal Failure": "signal_failure",
    "Wire Tensioning": "ohe_wear",
    "Jumper Wire Check": "insulator_flash",
    "Mast Alignment": "pantograph_zone",
    "Insulator Flashover": "insulator_flash",
}


@dataclass
class OptimizerInput:
    corridor_key: str
    date_start: datetime
    date_end: datetime
    max_block_duration_mins: int = 240
    min_shadow_multiplier: float = 1.5
    available_crews: dict = field(default_factory=lambda: {"TMS": 3, "SMMS": 2, "TDMS": 2})


@dataclass
class OptimizerOutput:
    blocks: list  # List of BlockWindow dicts
    total_shadow_multiplier: float = 0.0
    defects_covered: int = 0
    estimated_downtime_saved_mins: int = 0
    clusters_formed: int = 0
    unscheduled_count: int = 0
    solver_backend: str = ""


def _defect_to_maintenance_task(d: dict, idx: int) -> MaintenanceTask:
    """Convert a defect dict (from DB) into a block_planner MaintenanceTask."""
    dept = DEPT_TO_BP.get(d["department"], BPDepartment.ENGINEERING)
    poss = POSS_MAP.get(d.get("possession_type", "track"), PossessionType.TRACK)
    defect_type = DEFECT_TYPE_MAP.get(d.get("defect_category", ""), "rail_fracture")

    return MaintenanceTask(
        task_id=d["id"],
        department=dept,
        section_id=d["section_id"],
        chainage_km=d.get("chainage_km", float(idx * 2.5)),
        duration_min=d["est_duration_mins"],
        defect_type=defect_type,
        date_detected_days_ago=float(d.get("days_pending", 7)),
        days_overdue=float(d.get("days_overdue", 0)),
        possession_type=poss,
        human_criticality_score=min(5.0, max(1.0, d.get("criticality_score", 50) / 20.0)),
        existing_TSR_flag=d.get("existing_tsr_flag", 0),
        repeat_defect_count_90d=d.get("repeat_defect_count_90d", 0),
        season=d.get("season", "dry"),
        statutory_deadline_slot=None,
        statutory_lead_time_days=14.0,
        earliest_start_slot=0,
        soft_deadline_slot=None,
    )


def _section_to_bp(s: dict) -> BPSection:
    """Convert a section dict (from DB) into a block_planner Section."""
    return BPSection(
        section_id=s["section_id"],
        name=s.get("division", s["section_id"]),
        length_km=s.get("length_km", 25.0),
        traffic_density_gmt=float(s.get("traffic_density_gmt", 100)),
        passenger_criticality=float(s.get("passenger_criticality", 0.5)),
        redundancy_factor=int(s.get("redundancy_factor", 2)),
    )


def _build_synthetic_availability(
    sections: list[BPSection],
    slot_minutes: int,
    horizon_slots: int,
) -> dict[str, np.ndarray]:
    """
    Build a synthetic availability grid for each section.
    Night hours (0:00-5:00) are available, daytime is partially blocked by train traffic.
    """
    avail = {}
    for sec in sections:
        grid = np.zeros(horizon_slots, dtype=np.int8)
        for t in range(horizon_slots):
            hour = ((t * slot_minutes) // 60) % 24
            # Night windows (00:00–05:00): always available
            if 0 <= hour < 5:
                grid[t] = 1
            # Early morning / late night (05:00-07:00, 22:00-24:00): mostly available
            elif hour < 7 or hour >= 22:
                grid[t] = 1 if (t % 3 != 0) else 0
            # Daytime: sparse availability (maintenance windows between trains)
            else:
                # Higher traffic → fewer windows
                traffic_factor = min(sec.traffic_density_gmt / 200.0, 1.0)
                grid[t] = 1 if (t % max(3, int(4 * traffic_factor + 1)) == 0) else 0
        avail[sec.section_id] = grid
    return avail


async def run_shadow_optimizer(
    optimizer_input: OptimizerInput,
    defects: list[dict],
    sections: list[dict] | None = None,
) -> OptimizerOutput:
    """
    Full block_planner pipeline:
      1. Convert DB data → block_planner objects
      2. Score + bundle (criticality pipeline)
      3. Solve schedule (CP-SAT / MILP)
      4. Return results

    Args:
        optimizer_input: Constraints from the API request
        defects: List of defect dicts from DB
        sections: List of section dicts from DB (optional, will use defaults if None)
    """
    if not defects:
        return OptimizerOutput(blocks=[], solver_backend="none")

    # Limit to top-N by criticality to prevent solver timeout
    defects = sorted(defects, key=lambda d: d.get("criticality_score", 0), reverse=True)[:80]

    # 1. Convert to block_planner objects
    bp_tasks = [_defect_to_maintenance_task(d, i) for i, d in enumerate(defects)]

    if sections:
        bp_sections = [_section_to_bp(s) for s in sections]
    else:
        # Fallback: create minimal sections from unique section_ids
        unique_sids = list({d["section_id"] for d in defects})
        bp_sections = [
            BPSection(
                section_id=sid,
                name=sid,
                length_km=25.0,
                traffic_density_gmt=120.0,
                passenger_criticality=0.6,
                redundancy_factor=2,
            )
            for sid in unique_sids
        ]

    # 2. Run criticality pipeline (Layer A + bundling → SuperTask clusters)
    slot_minutes = 30
    days = max(1, (optimizer_input.date_end - optimizer_input.date_start).days)
    horizon_slots = days * 24 * (60 // slot_minutes)

    scored_tasks, clusters, scorer = run_criticality_pipeline(
        bp_tasks, bp_sections, slot_minutes=slot_minutes, blend_alpha=1.0, train_layer_b=False
    )

    if not clusters:
        return OptimizerOutput(blocks=[], solver_backend="pipeline", clusters_formed=0)

    # 3. Build availability grid
    availability = _build_synthetic_availability(bp_sections, slot_minutes, horizon_slots)

    # 4. Solve schedule
    result = solve_schedule(
        clusters,
        bp_sections,
        availability,
        horizon_slots=horizon_slots,
        slot_minutes=slot_minutes,
        backend="auto",
        time_limit_s=15.0,
    )

    # 5. Convert ScheduleResult → output format
    # Build a lookup from cluster_id → member task details
    cluster_lookup = {c.cluster_id: c for c in clusters}
    task_lookup = {t.task_id: t for t in scored_tasks}

    output_blocks = []
    total_task_duration = 0
    total_block_duration = 0

    run_id = int(datetime.utcnow().timestamp())

    for block in result.blocks:
        cluster = cluster_lookup.get(block.cluster_id)
        if not cluster:
            continue

        block_start_min = block.start_slot * slot_minutes
        block_end_min = block.end_slot * slot_minutes
        block_duration = block_end_min - block_start_min

        # Convert slot times to actual datetimes
        block_start_dt = optimizer_input.date_start + timedelta(minutes=block_start_min)
        block_end_dt = optimizer_input.date_start + timedelta(minutes=block_end_min)

        # Build packed tasks from cluster members
        packed_tasks = []
        for seq, tid in enumerate(cluster.member_task_ids, 1):
            task = task_lookup.get(tid)
            if task:
                packed_tasks.append({
                    "defect_id": tid,
                    "department": DEPT_FROM_BP.get(task.department, "TMS"),
                    "description": f"{task.defect_type} @ km {task.chainage_km:.1f}",
                    "est_duration_mins": task.duration_min,
                    "criticality_score": round(task.priority, 2),
                    "sequence_order": seq,
                })
                total_task_duration += task.duration_min

        # Shadow multiplier = total task work / block duration
        shadow_mult = round(total_task_duration / max(block_duration, 1), 2) if packed_tasks else 1.0

        output_blocks.append({
            "id": f"BLK-{run_id}-{block.cluster_id}",
            "corridor_section_id": block.section_id,
            "corridor_section_name": block.section_id,
            "corridor_key": optimizer_input.corridor_key,
            "start_time": block_start_dt.isoformat(),
            "end_time": block_end_dt.isoformat(),
            "duration_mins": block_duration,
            "packed_tasks": packed_tasks,
            "shadow_multiplier": shadow_mult,
            "status": "pending",
            "view": "weekly",
            "is_opportunistic": False,
            "priority": round(block.priority, 2),
        })
        total_block_duration += block_duration

    # Overall shadow multiplier
    overall_shadow = round(total_task_duration / max(total_block_duration, 1), 2)

    return OptimizerOutput(
        blocks=output_blocks,
        total_shadow_multiplier=overall_shadow,
        defects_covered=sum(len(b["packed_tasks"]) for b in output_blocks),
        estimated_downtime_saved_mins=max(0, total_task_duration - total_block_duration),
        clusters_formed=len(clusters),
        unscheduled_count=len(result.unscheduled),
        solver_backend=result.backend,
    )
