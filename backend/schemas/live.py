"""Pydantic schemas for live delay events."""
from pydantic import BaseModel
from typing import Optional
from .block import PackedTaskOut


class DelayEventOut(BaseModel):
    id: str
    train_id: str
    train_name: str
    delay_mins: int
    corridor_section_id: str
    corridor_section_name: str
    corridor_key: str
    window_opened_mins: int
    window_start: str  # ISO datetime
    suggested_tasks: list[PackedTaskOut]
    status: str  # open | accepted | dismissed
    created_at: str
    accepted_at: Optional[str] = None
    dismissed_at: Optional[str] = None

    model_config = {"from_attributes": True}
