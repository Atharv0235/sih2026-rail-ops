"""Pydantic schemas for block windows — matches frontend types."""
from pydantic import BaseModel
from typing import Optional


class PackedTaskOut(BaseModel):
    defect_id: str
    department: str
    description: str
    est_duration_mins: int
    criticality_score: float
    sequence_order: int

    model_config = {"from_attributes": True}


class BlockWindowOut(BaseModel):
    id: str
    corridor_section_id: str
    corridor_section_name: str
    corridor_key: str
    start_time: str  # ISO datetime
    end_time: str
    duration_mins: int
    packed_tasks: list[PackedTaskOut]
    shadow_multiplier: float
    status: str
    view: str
    is_opportunistic: bool
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None

    model_config = {"from_attributes": True}


class BlockScheduleQuery(BaseModel):
    view: str = "weekly"
    corridor_key: Optional[str] = None
    status: Optional[list[str]] = None


class BlockApproveRequest(BaseModel):
    user: str


class BlockModifyRequest(BaseModel):
    packed_tasks: list[PackedTaskOut]
