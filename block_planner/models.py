"""Shared data models for the Automatic Block Planning system."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Department(str, Enum):
    ENGINEERING = "Engineering"
    TD = "TractionDistribution"
    SNT = "SignalTelecom"


class PossessionType(str, Enum):
    TRACK = "track"
    OHE = "ohe"
    SIGNAL = "signal"
    COMBINED = "combined"


# Compatible possession types that can share a block
POSSESSION_COMPAT = {
    PossessionType.TRACK: {PossessionType.TRACK, PossessionType.COMBINED},
    PossessionType.OHE: {PossessionType.OHE, PossessionType.COMBINED},
    PossessionType.SIGNAL: {PossessionType.SIGNAL, PossessionType.COMBINED},
    PossessionType.COMBINED: {
        PossessionType.TRACK,
        PossessionType.OHE,
        PossessionType.SIGNAL,
        PossessionType.COMBINED,
    },
}


@dataclass
class Section:
    section_id: str
    name: str
    length_km: float
    traffic_density_gmt: float  # Gross Million Tonnes
    passenger_criticality: float  # 0–1
    redundancy_factor: int  # >= 1


@dataclass
class MaintenanceTask:
    task_id: str
    department: Department
    section_id: str
    chainage_km: float
    duration_min: int
    defect_type: str
    date_detected_days_ago: float  # age_days proxy
    days_overdue: float  # SMMS overdue; 0 if not overdue
    possession_type: PossessionType
    human_criticality_score: float  # raw inspector score ~[1, 5]
    existing_TSR_flag: int  # 0 or 1
    repeat_defect_count_90d: int
    season: str  # monsoon / winter / summer / dry
    statutory_deadline_slot: Optional[int] = None  # slot index if CRS-mandated
    statutory_lead_time_days: float = 14.0
    earliest_start_slot: int = 0
    soft_deadline_slot: Optional[int] = None
    # Filled by criticality scorer
    priority: float = 0.0
    risk_score: float = 0.0
    p_failure: float = 0.0
    consequence: float = 0.0
    # Synthetic outcome label (Layer B training)
    did_fail_before_fixed: int = 0
    days_to_failure: Optional[float] = None


@dataclass
class SuperTask:
    """Bundled cluster of nearby compatible tasks (feeds the scheduler)."""

    cluster_id: str
    section_id: str
    chainage_start: float
    chainage_end: float
    duration_slots: int  # duration in discrete time slots
    duration_min: int
    priority: float
    earliest_start: int
    deadline: Optional[int]  # hard statutory deadline slot (nullable)
    soft_deadline: Optional[int]
    member_task_ids: list[str] = field(default_factory=list)
    departments: list[str] = field(default_factory=list)
    possession_type: PossessionType = PossessionType.COMBINED


@dataclass
class ScheduledBlock:
    cluster_id: str
    section_id: str
    start_slot: int
    end_slot: int  # exclusive
    priority: float
    duration_slots: int
    buffer_slots: int = 0
    scheduled: bool = True

    @property
    def buffered_end(self) -> int:
        return self.end_slot + self.buffer_slots


@dataclass
class ScheduleResult:
    blocks: list[ScheduledBlock]
    unscheduled: list[str]
    horizon_slots: int
    slot_minutes: int
    backend: str
    objective: float = 0.0


@dataclass
class Train:
    train_id: str
    train_type: str  # pax | freight
    # ordered list of (section_id, planned_arrival_minutes_from_sim_start)
    scheduled_path: list[tuple[str, float]]


@dataclass
class DelayEvent:
    train_id: str
    section_id: str
    planned_time: float  # minutes from sim start
    actual_time: float
    delay_minutes: float


@dataclass
class RescheduleDiff:
    task_id: str
    old_window: tuple[int, int]  # (start, end) slots
    new_window: Optional[tuple[int, int]]  # None if dropped
    reason: str
    tier_used: int
