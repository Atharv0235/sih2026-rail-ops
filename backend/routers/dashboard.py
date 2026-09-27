"""Dashboard router — live KPI computation."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.kpi import compute_kpis

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
async def get_dashboard_kpis(db: AsyncSession = Depends(get_db)):
    """Compute and return live KPI metrics."""
    return await compute_kpis(db)
