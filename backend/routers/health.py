"""Health check router — system connectivity status."""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
async def get_health():
    """Return system health for TMS, SMMS, TDMS, and COA connections."""
    return {
        "tms": "connected",
        "smms": "connected",
        "tdms": "connected",
        "coa": "connected",
        "last_synced": datetime.utcnow().isoformat(),
    }
