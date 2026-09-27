"""Synthetic data generator for TMS / SMMS / TDMS / COA feeds."""

from __future__ import annotations

import math
from typing import Optional

import numpy as np

from block_planner.models import (
    Department,
    MaintenanceTask,
    PossessionType,
    Section,
    Train,
)

# Defect categories and λ_type decay rates (wear-out hazard)
LAMBDA_BY_TYPE: dict[str, float] = {
    "rail_fracture": 0.08,
    "loose_fitting": 0.03,
    "weld_defect": 0.05,
    "ohe_wear": 0.04,
    "insulator_flash": 0.06,
    "pantograph_zone": 0.035,
    "signal_failure": 0.07,
    "track_circuit": 0.045,
    "point_machine": 0.055,
}

DEPT_DEFECTS = {
    Department.ENGINEERING: [
        ("rail_fracture", PossessionType.TRACK, 90, 180),
        ("loose_fitting", PossessionType.TRACK, 45, 90),
        ("weld_defect", PossessionType.TRACK, 60, 120),
    ],
    Department.TD: [
        ("ohe_wear", PossessionType.OHE, 60, 150),
        ("insulator_flash", PossessionType.OHE, 45, 100),
        ("pantograph_zone", PossessionType.OHE, 50, 110),
    ],
    Department.SNT: [
        ("signal_failure", PossessionType.SIGNAL, 40, 90),
        ("track_circuit", PossessionType.SIGNAL, 50, 100),
        ("point_machine", PossessionType.SIGNAL, 55, 120),
    ],
}

SEASONS = ["monsoon", "winter", "summer", "dry"]

DEFAULT_SECTIONS = [
    ("SEC-A", "Delhi–Ghaziabad", 22.0, 85.0, 0.72, 2),
    ("SEC-B", "Ghaziabad–Kanpur", 48.0, 92.0, 0.65, 1),
    ("SEC-C", "Kanpur–Lucknow", 35.0, 70.0, 0.80, 2),
    ("SEC-D", "Lucknow–Varanasi", 40.0, 55.0, 0.55, 1),
    ("SEC-E", "Varanasi–Pt. Deen Dayal", 28.0, 60.0, 0.48, 3),
]


def generate_sections(rng: Optional[np.random.Generator] = None) -> list[Section]:
    rng = rng or np.random.default_rng(42)
    sections = []
    for sid, name, length, gmt, pax, red in DEFAULT_SECTIONS:
        # Small noise so GMT isn't identical every run with different seeds
        sections.append(
            Section(
                section_id=sid,
                name=name,
                length_km=length,
                traffic_density_gmt=float(gmt * rng.uniform(0.95, 1.05)),
                passenger_criticality=float(np.clip(pax + rng.normal(0, 0.02), 0, 1)),
                redundancy_factor=red,
            )
        )
    return sections


def _hidden_hazard_fail(
    age_days: float,
    defect_type: str,
    traffic_norm: float,
    tsr: int,
    rng: np.random.Generator,
) -> tuple[int, float]:
    """Hidden ground-truth hazard used only to synthesize Layer-B labels."""
    lam = LAMBDA_BY_TYPE.get(defect_type, 0.04)
    # Slightly different β than Layer A so the learned model has signal to learn
    p = 1.0 - math.exp(-lam * 1.2 * (age_days**1.4) / 30.0)
    p = min(0.95, p * (1.0 + 0.3 * traffic_norm + 0.2 * tsr))
    did_fail = int(rng.random() < p)
    # Days-to-failure drawn from residual hazard if it would fail
    if did_fail:
        days = float(rng.exponential(max(3.0, 40.0 * (1.0 - p))))
    else:
        days = float(age_days + rng.uniform(30, 120))
    return did_fail, days


def generate_tasks(
    sections: list[Section],
    n_per_dept: int = 12,
    slot_minutes: int = 30,
    weekly_slots: int = 7 * 24 * 2,  # 30-min slots over 7 days
    rng: Optional[np.random.Generator] = None,
) -> list[MaintenanceTask]:
    """Generate synthetic TMS/SMMS/TDMS maintenance tasks across 3 departments."""
    rng = rng or np.random.default_rng(42)
    gmt_vals = [s.traffic_density_gmt for s in sections]
    gmt_min, gmt_max = min(gmt_vals), max(gmt_vals)
    gmt_span = max(gmt_max - gmt_min, 1e-6)

    tasks: list[MaintenanceTask] = []
    tid = 0
    for dept, catalog in DEPT_DEFECTS.items():
        for _ in range(n_per_dept):
            section = sections[int(rng.integers(0, len(sections)))]
            defect_type, poss, dmin, dmax = catalog[int(rng.integers(0, len(catalog)))]
            duration = int(rng.integers(dmin, dmax + 1))
            # Round duration up to slot boundary
            duration = int(math.ceil(duration / slot_minutes) * slot_minutes)

            age = float(rng.uniform(1, 90))
            overdue = float(rng.choice([0.0, 0.0, 0.0, rng.uniform(1, 30)]))
            human = float(np.clip(rng.normal(3.0, 0.8), 1.0, 5.0))
            tsr = int(rng.random() < 0.18)
            season = SEASONS[int(rng.integers(0, len(SEASONS)))]

            # ~12% statutory / CRS-mandated deadlines
            statutory_deadline_slot = None
            if rng.random() < 0.12:
                # Must finish within first 3–5 days
                statutory_deadline_slot = int(rng.integers(weekly_slots // 3, weekly_slots // 2))

            soft_deadline = None
            if statutory_deadline_slot is None and rng.random() < 0.35:
                soft_deadline = int(rng.integers(weekly_slots // 2, weekly_slots))

            traffic_norm = (section.traffic_density_gmt - gmt_min) / gmt_span
            did_fail, days_fail = _hidden_hazard_fail(
                age, defect_type, traffic_norm, tsr, rng
            )

            tid += 1
            tasks.append(
                MaintenanceTask(
                    task_id=f"T-{dept.name[:3]}-{tid:03d}",
                    department=dept,
                    section_id=section.section_id,
                    chainage_km=float(rng.uniform(0.5, section.length_km - 0.5)),
                    duration_min=duration,
                    defect_type=defect_type,
                    date_detected_days_ago=age,
                    days_overdue=overdue,
                    possession_type=poss,
                    human_criticality_score=human,
                    existing_TSR_flag=tsr,
                    repeat_defect_count_90d=int(rng.integers(0, 4)),
                    season=season,
                    statutory_deadline_slot=statutory_deadline_slot,
                    statutory_lead_time_days=float(rng.choice([7, 14, 21])),
                    earliest_start_slot=int(rng.integers(0, max(1, weekly_slots // 14))),
                    soft_deadline_slot=soft_deadline,
                    did_fail_before_fixed=did_fail,
                    days_to_failure=days_fail,
                )
            )
    return tasks


def generate_timetable(
    sections: list[Section],
    horizon_minutes: int = 7 * 24 * 60,
    n_pax: int = 40,
    n_freight: int = 25,
    rng: Optional[np.random.Generator] = None,
) -> list[Train]:
    """Synthetic COA timetable: trains traversing corridor sections."""
    rng = rng or np.random.default_rng(42)
    trains: list[Train] = []
    section_ids = [s.section_id for s in sections]

    def _path(start_min: float, direction: int) -> list[tuple[str, float]]:
        order = section_ids if direction > 0 else list(reversed(section_ids))
        t = start_min
        path = []
        for sid in order:
            path.append((sid, t))
            # Dwell / transit 25–55 min per section
            t += float(rng.uniform(25, 55))
        return path

    for i in range(n_pax):
        start = float(rng.uniform(0, horizon_minutes - 300))
        trains.append(
            Train(
                train_id=f"PAX-{i + 1:03d}",
                train_type="pax",
                scheduled_path=_path(start, int(rng.choice([-1, 1]))),
            )
        )
    for i in range(n_freight):
        start = float(rng.uniform(0, horizon_minutes - 400))
        trains.append(
            Train(
                train_id=f"FRT-{i + 1:03d}",
                train_type="freight",
                scheduled_path=_path(start, int(rng.choice([-1, 1]))),
            )
        )
    return trains


def build_availability(
    sections: list[Section],
    trains: list[Train],
    horizon_slots: int,
    slot_minutes: int = 30,
    safety_margin_slots: int = 1,
) -> dict[str, np.ndarray]:
    """
    available[section_id][t] = 1 if no train occupies section in slot t
    (with a safety margin of neighbouring slots).
    """
    avail: dict[str, np.ndarray] = {
        s.section_id: np.ones(horizon_slots, dtype=np.int8) for s in sections
    }

    for train in trains:
        for section_id, planned_min in train.scheduled_path:
            if section_id not in avail:
                continue
            slot = int(planned_min // slot_minutes)
            for ds in range(-safety_margin_slots, safety_margin_slots + 2):
                # occupy planned slot + transit spill (~1 extra slot) + margin
                idx = slot + ds
                if 0 <= idx < horizon_slots:
                    avail[section_id][idx] = 0

    # Guarantee some maintenance windows: force a subset of night slots free
    # (night = slots where hour in [0,5]) so the scheduler has room to work,
    # but keep corridors tight enough that not everything fits in one week.
    for sid, grid in avail.items():
        for t in range(horizon_slots):
            hour = ((t * slot_minutes) // 60) % 24
            if 0 <= hour < 5 and grid[t] == 0:
                if (t * 17 + hash(sid)) % 7 == 0:
                    grid[t] = 1

    return avail


def generate_scenario(
    seed: int = 42,
    n_per_dept: int = 12,
    slot_minutes: int = 30,
    days: int = 7,
) -> dict:
    """One-shot scenario pack used by main.py and tests."""
    rng = np.random.default_rng(seed)
    horizon_slots = days * 24 * (60 // slot_minutes)
    sections = generate_sections(rng)
    tasks = generate_tasks(
        sections,
        n_per_dept=n_per_dept,
        slot_minutes=slot_minutes,
        weekly_slots=horizon_slots,
        rng=rng,
    )
    trains = generate_timetable(
        sections,
        horizon_minutes=days * 24 * 60,
        rng=rng,
    )
    availability = build_availability(
        sections, trains, horizon_slots, slot_minutes=slot_minutes
    )
    return {
        "sections": sections,
        "tasks": tasks,
        "trains": trains,
        "availability": availability,
        "horizon_slots": horizon_slots,
        "slot_minutes": slot_minutes,
        "seed": seed,
    }


if __name__ == "__main__":
    scenario = generate_scenario()
    print(f"Sections: {len(scenario['sections'])}")
    print(f"Tasks:    {len(scenario['tasks'])}")
    print(f"Trains:   {len(scenario['trains'])}")
    print(f"Horizon:  {scenario['horizon_slots']} slots × {scenario['slot_minutes']} min")
    free = {sid: int(g.sum()) for sid, g in scenario["availability"].items()}
    print(f"Free slots/section: {free}")
