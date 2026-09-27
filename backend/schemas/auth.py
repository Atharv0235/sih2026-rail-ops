"""Pydantic schemas for auth — matches frontend User type."""
from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    role: str  # controller | engineer
    department: Optional[str] = None  # TMS | SMMS | TDMS


class UserOut(BaseModel):
    id: str
    name: str
    role: str
    department: Optional[str] = None
    division: str

    model_config = {"from_attributes": True}
