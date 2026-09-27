"""DelayEvent ORM model — live delay opportunities."""
from sqlalchemy import String, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import datetime


class DelayEvent(Base):
    __tablename__ = "delay_events"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    train_id: Mapped[str] = mapped_column(String(20))
    train_name: Mapped[str] = mapped_column(String(100))
    delay_mins: Mapped[int] = mapped_column(Integer)
    corridor_section_id: Mapped[str] = mapped_column(String(30))
    corridor_section_name: Mapped[str] = mapped_column(String(100), default="")
    corridor_key: Mapped[str] = mapped_column(String(20), default="")
    window_opened_mins: Mapped[int] = mapped_column(Integer, default=0)
    window_start: Mapped[datetime.datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open | accepted | dismissed
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    accepted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    dismissed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    # suggested_tasks are stored as JSON string for simplicity
    suggested_tasks_json: Mapped[str] = mapped_column(String(2000), default="[]")
