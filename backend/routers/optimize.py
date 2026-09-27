"""Optimize router — runs the full block_planner pipeline and persists results."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from models.defect import Defect
from models.section import BlockSection
from models.block import BlockWindow, PackedTask
from services.optimizer import run_shadow_optimizer, OptimizerInput

router = APIRouter(prefix="/api/optimize", tags=["optimize"])


class OptimizeRequest(BaseModel):
    corridor_key: str
    date_start: str  # ISO datetime
    date_end: str
    max_block_duration_mins: int = 240
    min_shadow_multiplier: float = 1.5
    available_crews: Optional[dict] = None


@router.post("")
async def run_optimizer(req: OptimizeRequest, db: AsyncSession = Depends(get_db)):
    """
    Block Planner Optimizer Endpoint.

    Takes corridor + constraints, fetches scored defects + sections from DB,
    runs the full criticality → bundling → CP-SAT/MILP pipeline.
    """
    # Fetch defects for the requested corridor's sections
    prefix = req.corridor_key.split("-")[0] if req.corridor_key else ""
    defect_result = await db.execute(
        select(Defect)
        .where(Defect.section_id.like(f"{prefix}%"))
        .where(Defect.status.in_(["Pending", "Scheduled"]))
        .order_by(Defect.criticality_score.desc())
    )
    defects = defect_result.scalars().all()

    if not defects:
        raise HTTPException(status_code=404, detail="No pending defects found for this corridor")

    # Fetch sections
    section_result = await db.execute(
        select(BlockSection).where(BlockSection.section_id.like(f"{prefix}%"))
    )
    sections = section_result.scalars().all()

    # Convert to dicts for the optimizer (includes all block_planner fields)
    defect_dicts = [
        {
            "id": d.id,
            "department": d.department,
            "section_id": d.section_id,
            "defect_category": d.defect_category,
            "criticality_score": d.criticality_score,
            "urgency_band": d.urgency_band,
            "est_duration_mins": d.est_duration_mins,
            "days_pending": d.days_pending,
            "severity_normalized": d.severity_normalized,
            "power_block_req": d.power_block_req,
            # block_planner fields
            "chainage_km": d.chainage_km,
            "possession_type": d.possession_type,
            "existing_tsr_flag": d.existing_tsr_flag,
            "repeat_defect_count_90d": d.repeat_defect_count_90d,
            "season": d.season,
            "days_overdue": d.days_overdue,
        }
        for d in defects
    ]

    section_dicts = [
        {
            "section_id": s.section_id,
            "division": s.division,
            "traffic_density_gmt": s.traffic_density_gmt,
            "max_speed_kmh": s.max_speed_kmh,
            "length_km": s.length_km,
            "passenger_criticality": s.passenger_criticality,
            "redundancy_factor": s.redundancy_factor,
        }
        for s in sections
    ]

    optimizer_input = OptimizerInput(
        corridor_key=req.corridor_key,
        date_start=datetime.fromisoformat(req.date_start),
        date_end=datetime.fromisoformat(req.date_end),
        max_block_duration_mins=req.max_block_duration_mins,
        min_shadow_multiplier=req.min_shadow_multiplier,
        available_crews=req.available_crews or {"TMS": 3, "SMMS": 2, "TDMS": 2},
    )

    try:
        output = await run_shadow_optimizer(optimizer_input, defect_dicts, section_dicts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimizer error: {str(e)}")

    # Persist resulting blocks to DB
    persisted_block_ids = []
    for block_data in output.blocks:
        block_id = block_data["id"]
        new_block = BlockWindow(
            id=block_id,
            corridor_section_id=block_data["corridor_section_id"],
            corridor_section_name=block_data["corridor_section_name"],
            corridor_key=block_data["corridor_key"],
            start_time=datetime.fromisoformat(block_data["start_time"]),
            end_time=datetime.fromisoformat(block_data["end_time"]),
            duration_mins=block_data["duration_mins"],
            shadow_multiplier=block_data["shadow_multiplier"],
            status="pending",
            view="weekly",
            is_opportunistic=False,
        )
        db.add(new_block)

        # Add packed tasks
        for task_data in block_data.get("packed_tasks", []):
            packed = PackedTask(
                block_id=block_id,
                defect_id=task_data["defect_id"],
                department=task_data["department"],
                description=task_data["description"],
                est_duration_mins=task_data["est_duration_mins"],
                criticality_score=task_data["criticality_score"],
                sequence_order=task_data["sequence_order"],
            )
            db.add(packed)

        persisted_block_ids.append(block_id)

    # Mark scheduled defects
    scheduled_defect_ids = set()
    for block_data in output.blocks:
        for task_data in block_data.get("packed_tasks", []):
            scheduled_defect_ids.add(task_data["defect_id"])

    if scheduled_defect_ids:
        for defect in defects:
            if defect.id in scheduled_defect_ids:
                defect.status = "Scheduled"

    await db.commit()

    return {
        "blocks": output.blocks,
        "total_shadow_multiplier": output.total_shadow_multiplier,
        "defects_covered": output.defects_covered,
        "estimated_downtime_saved_mins": output.estimated_downtime_saved_mins,
        "clusters_formed": output.clusters_formed,
        "unscheduled_count": output.unscheduled_count,
        "solver_backend": output.solver_backend,
        "persisted_block_ids": persisted_block_ids,
    }
