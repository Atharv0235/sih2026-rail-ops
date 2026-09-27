"""Block section ORM model — maps to large_block_sections.csv."""
from sqlalchemy import String, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class BlockSection(Base):
    __tablename__ = "block_sections"

    section_id: Mapped[str] = mapped_column(String(30), primary_key=True)
    division: Mapped[str] = mapped_column(String(50))
    traffic_density_gmt: Mapped[int] = mapped_column(Integer)
    max_speed_kmh: Mapped[int] = mapped_column(Integer)

    # ── Fields required by block_planner.models.Section ──
    length_km: Mapped[float] = mapped_column(Float, default=25.0)
    passenger_criticality: Mapped[float] = mapped_column(Float, default=0.5)  # 0–1
    redundancy_factor: Mapped[int] = mapped_column(Integer, default=1)  # ≥ 1
