"""BlockWindow and PackedTask ORM models."""
from sqlalchemy import String, Integer, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import datetime


class BlockWindow(Base):
    __tablename__ = "block_windows"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    corridor_section_id: Mapped[str] = mapped_column(String(30))
    corridor_section_name: Mapped[str] = mapped_column(String(100), default="")
    corridor_key: Mapped[str] = mapped_column(String(20), default="")
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime.datetime] = mapped_column(DateTime)
    duration_mins: Mapped[int] = mapped_column(Integer)
    shadow_multiplier: Mapped[float] = mapped_column(Float, default=1.0)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | approved | modified | in_progress | completed
    view: Mapped[str] = mapped_column(String(10), default="weekly")
    is_opportunistic: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    approved_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)

    packed_tasks: Mapped[list["PackedTask"]] = relationship(
        back_populates="block", cascade="all, delete-orphan", lazy="selectin"
    )


class PackedTask(Base):
    __tablename__ = "packed_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    block_id: Mapped[str] = mapped_column(String(30), ForeignKey("block_windows.id"))
    defect_id: Mapped[str] = mapped_column(String(30))
    department: Mapped[str] = mapped_column(String(10))
    description: Mapped[str] = mapped_column(String(300), default="")
    est_duration_mins: Mapped[int] = mapped_column(Integer, default=0)
    criticality_score: Mapped[float] = mapped_column(Float, default=0.0)
    sequence_order: Mapped[int] = mapped_column(Integer, default=0)

    block: Mapped["BlockWindow"] = relationship(back_populates="packed_tasks")
