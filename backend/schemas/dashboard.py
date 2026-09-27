"""Pydantic schema for KPI dashboard — matches frontend KPIDashboard type."""
from pydantic import BaseModel


class KPIDashboardOut(BaseModel):
    shadow_multiplier: float
    critical_defects_pending: int
    blocks_this_week: int
    downtime_saved_mtd_hours: float
    multiplier_trend: float
    defects_trend: float
    blocks_trend: float
    downtime_trend: float
