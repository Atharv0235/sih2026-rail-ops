"""User ORM model — simple RBAC."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20))  # controller | engineer
    department: Mapped[str | None] = mapped_column(String(10), nullable=True)  # TMS | SMMS | TDMS
    division: Mapped[str] = mapped_column(String(50), default="Bhopal")
