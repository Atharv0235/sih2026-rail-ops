"""Defects router — backlog with filtering, sorting, and search."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from models.defect import Defect
from models.section import BlockSection
from schemas.defect import DefectOut, CriticalityScoreOut
from services.criticality import decompose_score

router = APIRouter(prefix="/api/defects", tags=["defects"])


def _defect_to_out(d: Defect, section_id: str) -> dict:
    """Convert a Defect ORM instance to the frontend's expected shape."""
    decomposed = decompose_score(
        d.criticality_score,
        d.severity_normalized,
        d.days_pending,
        0,  # traffic density placeholder for decomposition
        d.severity_raw if d.department == "SMMS" else 0.0,
    )
    return {
        "id": d.id,
        "department": d.department,
        "corridor_section_id": d.section_id,
        "corridor_section_name": d.section_id,  # Use section_id as name
        "chainage_km": d.chainage_km,
        "description": f"{d.defect_category} — {d.section_id}",
        "defect_type": d.defect_category,
        "severity": d.urgency_band,
        "criticality": decomposed,
        "est_duration_mins": d.est_duration_mins,
        "overdue_days": d.days_pending,
        "status": d.status.lower().replace(" ", "_"),
        "reported_at": d.date_detected.isoformat(),
        "last_inspected_at": d.date_detected.isoformat(),
        "assigned_crew": None,
        "not_scheduled_reason": None,
    }


@router.get("")
async def get_backlog(
    departments: Optional[str] = Query(None, description="Comma-separated: TMS,SMMS,TDMS"),
    urgency: Optional[str] = Query(None, description="Comma-separated: critical,high,medium,low"),
    status: Optional[str] = Query(None, description="Comma-separated status filters"),
    corridor_section_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Filtered defect backlog, sorted by criticality score (descending)."""
    query = select(Defect)

    if departments:
        dept_list = [d.strip() for d in departments.split(",")]
        query = query.where(Defect.department.in_(dept_list))

    if urgency:
        urg_list = [u.strip() for u in urgency.split(",")]
        query = query.where(Defect.urgency_band.in_(urg_list))

    if status:
        status_list = [s.strip() for s in status.split(",")]
        query = query.where(Defect.status.in_(status_list))

    if corridor_section_id:
        query = query.where(Defect.section_id == corridor_section_id)

    if search:
        q = f"%{search}%"
        query = query.where(
            or_(
                Defect.id.ilike(q),
                Defect.defect_category.ilike(q),
                Defect.section_id.ilike(q),
            )
        )

    # Sort by freshly submitted defects first (for prototype visibility), then criticality descending
    query = query.order_by(
        Defect.id.like("%SUB%").desc(),
        Defect.criticality_score.desc()
    )

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    defects = result.scalars().all()

    return [_defect_to_out(d, d.section_id) for d in defects]


@router.get("/count")
async def get_defect_counts(
    db: AsyncSession = Depends(get_db),
):
    """Get defect counts by department and urgency band."""
    from sqlalchemy import func

    # Count by department
    dept_result = await db.execute(
        select(Defect.department, func.count()).group_by(Defect.department)
    )
    by_dept = {row[0]: row[1] for row in dept_result.all()}

    # Count by urgency band
    urg_result = await db.execute(
        select(Defect.urgency_band, func.count()).group_by(Defect.urgency_band)
    )
    by_urgency = {row[0]: row[1] for row in urg_result.all()}

    return {"by_department": by_dept, "by_urgency": by_urgency}


@router.get("/{defect_id}")
async def get_defect_by_id(
    defect_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single defect by ID."""
    result = await db.execute(select(Defect).where(Defect.id == defect_id))
    defect = result.scalar_one_or_none()
    if not defect:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Defect not found")
    return _defect_to_out(defect, defect.section_id)


# ── New: Submit a defect (engineer request) with XGBoost scoring ──

from pydantic import BaseModel
from datetime import date
from services.criticality import score_single, urgency_band, decompose_score
from config import DEPT_CODE_MAP
import uuid


class DefectSubmitRequest(BaseModel):
    department: str  # TMS | SMMS | TDMS
    section_id: str
    defect_category: str
    est_duration_mins: int
    severity_human: int  # 1-10 from the slider
    chainage_km: float = 0.0
    geolocation: str = ""
    machinery: str = ""


@router.post("/submit")
async def submit_defect(
    req: DefectSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a new defect from an engineer.
    Runs XGBoost scoring to compute AI criticality score.
    Returns the scored defect.
    """
    from fastapi import HTTPException

    # Validate required fields
    if not req.department or req.department not in DEPT_CODE_MAP:
        raise HTTPException(status_code=400, detail="Invalid department. Must be TMS, SMMS, or TDMS.")
    if not req.section_id:
        raise HTTPException(status_code=400, detail="Block section is required.")
    if not req.defect_category:
        raise HTTPException(status_code=400, detail="Defect category is required.")
    if req.est_duration_mins <= 0:
        raise HTTPException(status_code=400, detail="Estimated duration must be positive.")
    if req.severity_human < 1 or req.severity_human > 10:
        raise HTTPException(status_code=400, detail="Severity must be between 1 and 10.")

    # Look up section for traffic_density and max_speed
    section_result = await db.execute(
        select(BlockSection).where(BlockSection.section_id == req.section_id)
    )
    section = section_result.scalar_one_or_none()
    traffic_density = section.traffic_density_gmt if section else 100
    max_speed = section.max_speed_kmh if section else 100

    # Run XGBoost scoring (10 features)
    dept_code = DEPT_CODE_MAP[req.department]
    days_pending = 0  # New defect, just submitted
    tsr_for_scoring = 1 if req.severity_human >= 7 else 0
    season_encode_map = {"dry": 0, "summer": 1, "winter": 2, "monsoon": 3}
    _m = date.today().month
    if 6 <= _m <= 9:
        _season = "monsoon"
    elif _m in (11, 12, 1, 2):
        _season = "winter"
    elif 3 <= _m <= 5:
        _season = "summer"
    else:
        _season = "dry"
    redundancy = 1 if traffic_density >= 140 else 2

    criticality = score_single(
        dept_code=dept_code,
        severity=req.severity_human,
        days_pending=days_pending,
        est_duration_mins=req.est_duration_mins,
        traffic_density_gmt=traffic_density,
        max_speed_kmh=max_speed,
        existing_tsr_flag=tsr_for_scoring,
        repeat_defect_count_90d=0,
        season_encoded=season_encode_map.get(_season, 0),
        redundancy_factor=redundancy,
    )
    band = urgency_band(criticality)

    # Generate unique ID
    defect_id = f"{req.department}-SUB-{uuid.uuid4().hex[:6].upper()}"

    # Derive block_planner fields for the new defect
    import hashlib
    _h = int(hashlib.md5(f"{defect_id}:{req.section_id}".encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
    section_length = 25.0  # default; could look up from DB
    chainage = round(0.5 + _h * max(section_length - 1.0, 1.0), 2)
    poss_type = "ohe" if req.department == "TDMS" else {"TMS": "track", "SMMS": "signal"}.get(req.department, "track")
    tsr_flag = 1 if req.severity_human >= 7 else 0
    repeat_count = int(_h * 4) % 4
    today_date = date.today()
    m = today_date.month
    if 6 <= m <= 9:
        season_val = "monsoon"
    elif m in (11, 12, 1, 2):
        season_val = "winter"
    elif 3 <= m <= 5:
        season_val = "summer"
    else:
        season_val = "dry"

    # Create defect record
    new_defect = Defect(
        id=defect_id,
        department=req.department,
        section_id=req.section_id,
        defect_category=req.defect_category,
        severity_raw=float(req.severity_human),
        power_block_req=(req.department == "TDMS"),
        date_detected=today_date,
        est_duration_mins=req.est_duration_mins,
        status="pending",
        criticality_score=round(criticality, 2),
        urgency_band=band,
        days_pending=0,
        severity_normalized=req.severity_human,
        # block_planner fields
        chainage_km=chainage,
        possession_type=poss_type,
        existing_tsr_flag=tsr_flag,
        repeat_defect_count_90d=repeat_count,
        season=season_val,
        days_overdue=0.0,
    )
    db.add(new_defect)
    await db.commit()
    await db.refresh(new_defect)

    # Return the scored defect
    decomposed = decompose_score(
        criticality, req.severity_human, 0, traffic_density, 0.0
    )

    return {
        "id": defect_id,
        "department": req.department,
        "section_id": req.section_id,
        "defect_category": req.defect_category,
        "criticality_score": round(criticality, 2),
        "urgency_band": band,
        "criticality": decomposed,
        "est_duration_mins": req.est_duration_mins,
        "status": "pending",
        "message": f"Defect submitted successfully. AI Criticality Score: {criticality:.1f} ({band.upper()})",
    }


@router.get("/sections/list")
async def get_sections(
    division: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get block sections, optionally filtered by division."""
    query = select(BlockSection)
    if division:
        query = query.where(BlockSection.division == division)
    result = await db.execute(query)
    sections = result.scalars().all()
    return [{"section_id": s.section_id, "division": s.division} for s in sections]

