"""Unified Defect ORM model — merges TMS, SMMS, and TDMS defects."""
from sqlalchemy import String, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import datetime


class Defect(Base):
    __tablename__ = "defects"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)  # e.g. TMS-2026-1
    department: Mapped[str] = mapped_column(String(10))  # TMS | SMMS | TDMS
    section_id: Mapped[str] = mapped_column(String(30), ForeignKey("block_sections.section_id"))

    # Department-specific raw fields (stored for traceability)
    defect_category: Mapped[str] = mapped_column(String(50))  # e.g. "Ballast Packing", "Point Machine"
    severity_raw: Mapped[float] = mapped_column(Float, default=0.0)  # TMS: 1-10, SMMS: 0-1 prob, TDMS: mapped
    power_block_req: Mapped[bool] = mapped_column(default=False)  # TDMS only

    # Common fields
    date_detected: Mapped[datetime.date] = mapped_column(Date)
    est_duration_mins: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="Pending")  # Pending | Scheduled | Completed

    # AI-computed fields (populated by XGBoost scoring)
    criticality_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100
    urgency_band: Mapped[str] = mapped_column(String(10), default="low")  # critical | high | medium | low

    # Derived (computed at ingestion)
    days_pending: Mapped[int] = mapped_column(Integer, default=0)
    severity_normalized: Mapped[int] = mapped_column(Integer, default=0)  # Normalized to int for XGBoost

    # ── Fields required by block_planner.models.MaintenanceTask ──
    chainage_km: Mapped[float] = mapped_column(Float, default=0.0)  # Position along section for spatial clustering
    possession_type: Mapped[str] = mapped_column(String(10), default="track")  # track | ohe | signal | combined
    existing_tsr_flag: Mapped[int] = mapped_column(Integer, default=0)  # 0 or 1 — Temporary Speed Restriction
    repeat_defect_count_90d: Mapped[int] = mapped_column(Integer, default=0)  # Repeat defects in last 90 days
    season: Mapped[str] = mapped_column(String(10), default="dry")  # monsoon | winter | summer | dry
    days_overdue: Mapped[float] = mapped_column(Float, default=0.0)  # SMMS overdue beyond threshold
