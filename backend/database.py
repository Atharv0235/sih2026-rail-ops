"""
RAIL-OPS Backend — Database engine and session factory (async SQLite).
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with async_session() as session:
        yield session


async def create_tables():
    """Create all tables (called once at startup)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
