"""Blocks router — schedule, approve, modify."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from database import get_db
from models.block import BlockWindow, PackedTask
from schemas.block import BlockWindowOut, BlockApproveRequest, PackedTaskOut

router = APIRouter(prefix="/api/blocks", tags=["blocks"])


def _block_to_out(block: BlockWindow) -> dict:
    """Convert BlockWindow ORM to frontend-compatible dict."""
    return {
        "id": block.id,
        "corridor_section_id": block.corridor_section_id,
        "corridor_section_name": block.corridor_section_name,
        "corridor_key": block.corridor_key,
        "start_time": block.start_time.isoformat() if block.start_time else "",
        "end_time": block.end_time.isoformat() if block.end_time else "",
        "duration_mins": block.duration_mins,
        "packed_tasks": [
            {
                "defect_id": t.defect_id,
                "department": t.department,
                "description": t.description,
                "est_duration_mins": t.est_duration_mins,
                "criticality_score": t.criticality_score,
                "sequence_order": t.sequence_order,
            }
            for t in (block.packed_tasks or [])
        ],
        "shadow_multiplier": block.shadow_multiplier,
        "status": block.status,
        "view": block.view,
        "is_opportunistic": block.is_opportunistic,
        "approved_by": block.approved_by,
        "approved_at": block.approved_at.isoformat() if block.approved_at else None,
    }


@router.get("")
async def get_block_schedule(
    view: str = Query("weekly"),
    corridor_key: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="Comma-separated status filters"),
    db: AsyncSession = Depends(get_db),
):
    """Get block schedule with optional filters."""
    query = select(BlockWindow).where(BlockWindow.view == view)

    if corridor_key:
        query = query.where(BlockWindow.corridor_key == corridor_key)

    if status:
        status_list = [s.strip() for s in status.split(",")]
        query = query.where(BlockWindow.status.in_(status_list))

    query = query.order_by(BlockWindow.start_time)
    result = await db.execute(query)
    blocks = result.scalars().unique().all()

    return [_block_to_out(b) for b in blocks]


@router.post("/{block_id}/approve")
async def approve_block(
    block_id: str,
    req: BlockApproveRequest,
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending block (Controller only)."""
    result = await db.execute(select(BlockWindow).where(BlockWindow.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    block.status = "approved"
    block.approved_by = req.user
    block.approved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(block)

    return _block_to_out(block)


@router.put("/{block_id}")
async def modify_block(
    block_id: str,
    tasks: list[PackedTaskOut],
    db: AsyncSession = Depends(get_db),
):
    """Modify the packed tasks in a block."""
    result = await db.execute(select(BlockWindow).where(BlockWindow.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    # Clear existing tasks
    for t in block.packed_tasks:
        await db.delete(t)

    # Add new tasks
    for t in tasks:
        new_task = PackedTask(
            block_id=block_id,
            defect_id=t.defect_id,
            department=t.department,
            description=t.description,
            est_duration_mins=t.est_duration_mins,
            criticality_score=t.criticality_score,
            sequence_order=t.sequence_order,
        )
        db.add(new_task)

    block.status = "modified"
    await db.commit()
    await db.refresh(block)

    return _block_to_out(block)
