"""Pydantic schemas for defects — matches frontend types/index.ts."""
from pydantic import BaseModel
from typing import Optional


class CriticalityScoreOut(BaseModel):
    overall: float
    severity: float
    overdue_factor: float
    traffic_density: float
    failure_risk: float


class DefectOut(BaseModel):
    id: str
    department: str  # TMS | SMMS | TDMS
    corridor_section_id: str
    corridor_section_name: str
    chainage_km: float
    description: str
    defect_type: str
    severity: str  # critical | high | medium | low
    criticality: CriticalityScoreOut
    est_duration_mins: int
    overdue_days: int
    status: str
    reported_at: str  # ISO date
    last_inspected_at: str  # ISO date
    assigned_crew: Optional[str] = None
    not_scheduled_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class BacklogFilters(BaseModel):
    departments: Optional[list[str]] = None
    corridor_section_id: Optional[str] = None
    urgency: Optional[list[str]] = None
    status: Optional[list[str]] = None
    search: Optional[str] = None
