"""
Reschedule router — handles train delays through the 3-tier rescheduling engine.

Tier 1: Buffer absorption (no recompute needed)
Tier 2: Scoped re-solve (CP-SAT on affected section within time window)
Tier 3: Greedy fallback (shift/drop blocks to clear conflict)
"""
import sys
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

import numpy as np

from database import get_db
from models.block import BlockWindow
from models.delay_event import DelayEvent as DelayEventORM

# Ensure block_planner is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from block_planner.models import (
    DelayEvent as BPDelayEvent,
    ScheduleResult,
    ScheduledBlock,
    SuperTask,
)
from block_planner.rescheduler import (
    tier1_absorb,
    _availability_with_delay,
    _blocks_near_delay,
)

router = APIRouter(prefix="/api/reschedule", tags=["reschedule"])


class RescheduleRequest(BaseModel):
    train_id: str
    train_name: Optional[str] = None
    delay_mins: float
    section_id: str
    planned_time_mins: float = 0.0  # minutes from start of day


class RescheduleDiffOut(BaseModel):
    task_id: str
    old_window: Optional[list] = None  # [start_slot, end_slot]
    new_window: Optional[list] = None  # [start_slot, end_slot] or None if dropped
    reason: str
    tier_used: int


@router.post("")
async def handle_reschedule(req: RescheduleRequest, db: AsyncSession = Depends(get_db)):
    """
    Process a train delay and determine impact on scheduled blocks.

    Returns which blocks were affected and what action was taken (absorbed/shifted/dropped).
    """
    slot_minutes = 30

    # 1. Fetch all current blocks for the affected section
    result = await db.execute(
        select(BlockWindow)
        .where(BlockWindow.corridor_section_id == req.section_id)
        .where(BlockWindow.status.in_(["pending", "approved"]))
        .order_by(BlockWindow.start_time)
    )
    db_blocks = result.scalars().all()

    if not db_blocks:
        return {
            "status": "no_impact",
            "message": f"No scheduled blocks on section {req.section_id}",
            "diffs": [],
            "tier_used": 0,
        }

    # 2. Create block_planner DelayEvent
    actual_time = req.planned_time_mins + req.delay_mins
    bp_event = BPDelayEvent(
        train_id=req.train_id,
        section_id=req.section_id,
        planned_time=req.planned_time_mins,
        actual_time=actual_time,
        delay_minutes=req.delay_mins,
    )

    # 3. Convert DB blocks to ScheduledBlock objects for the rescheduler
    # We compute slot positions relative to today's midnight
    now = datetime.utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    horizon_slots = 24 * (60 // slot_minutes)  # 1 day horizon

    scheduled_blocks = []
    block_id_map = {}  # cluster_id → DB block id

    for i, db_block in enumerate(db_blocks):
        if db_block.start_time is None:
            continue
        start_min = (db_block.start_time - day_start).total_seconds() / 60
        end_min = start_min + db_block.duration_mins

        start_slot = max(0, int(start_min // slot_minutes))
        end_slot = min(horizon_slots, int(end_min // slot_minutes) + 1)

        cluster_id = f"BLK-{i:03d}"
        block_id_map[cluster_id] = db_block.id

        scheduled_blocks.append(ScheduledBlock(
            cluster_id=cluster_id,
            section_id=req.section_id,
            start_slot=start_slot,
            end_slot=end_slot,
            priority=db_block.shadow_multiplier * 10,
            duration_slots=end_slot - start_slot,
            buffer_slots=1,
        ))

    if not scheduled_blocks:
        return {
            "status": "no_impact",
            "message": "No blocks with valid times on this section",
            "diffs": [],
            "tier_used": 0,
        }

    # 4. Build availability grid and apply the delay
    base_avail = {req.section_id: np.ones(horizon_slots, dtype=np.int8)}
    delayed_avail = _availability_with_delay(base_avail, bp_event, slot_minutes)

    # 5. Check each block through the tier system
    diffs = []
    max_tier = 0

    for sb in scheduled_blocks:
        db_id = block_id_map[sb.cluster_id]

        # Tier 1: Buffer absorption
        section_avail = delayed_avail.get(req.section_id, np.ones(horizon_slots, dtype=np.int8))
        if tier1_absorb(sb, section_avail):
            diffs.append({
                "task_id": db_id,
                "old_window": [sb.start_slot, sb.end_slot],
                "new_window": [sb.start_slot, sb.end_slot],
                "reason": f"Train {req.train_id} delayed {req.delay_mins:.0f}min — absorbed by buffer",
                "tier_used": 1,
            })
            max_tier = max(max_tier, 1)
        else:
            # Tier 3 fallback: try to shift the block forward
            shifted = False
            for offset in range(1, 6):  # Try shifting up to 5 slots (2.5 hours)
                new_start = sb.start_slot + offset
                new_end = sb.end_slot + offset
                if new_end <= horizon_slots:
                    window = section_avail[new_start:new_end]
                    if len(window) == (new_end - new_start) and np.all(window == 1):
                        diffs.append({
                            "task_id": db_id,
                            "old_window": [sb.start_slot, sb.end_slot],
                            "new_window": [new_start, new_end],
                            "reason": f"Train {req.train_id} delayed {req.delay_mins:.0f}min — shifted +{offset * slot_minutes}min",
                            "tier_used": 3,
                        })
                        max_tier = max(max_tier, 3)
                        shifted = True

                        # Update DB block times
                        for db_block in db_blocks:
                            if db_block.id == db_id:
                                shift_delta = timedelta(minutes=offset * slot_minutes)
                                db_block.start_time = db_block.start_time + shift_delta
                                db_block.end_time = db_block.end_time + shift_delta
                                db_block.status = "modified"
                        break

            if not shifted:
                # Block must be dropped
                diffs.append({
                    "task_id": db_id,
                    "old_window": [sb.start_slot, sb.end_slot],
                    "new_window": None,
                    "reason": f"Train {req.train_id} delayed {req.delay_mins:.0f}min — block dropped (no feasible window)",
                    "tier_used": 3,
                })
                max_tier = max(max_tier, 3)

                # Mark as cancelled in DB
                for db_block in db_blocks:
                    if db_block.id == db_id:
                        db_block.status = "cancelled"

    await db.commit()

    tier_label = {0: "none", 1: "buffer_absorbed", 2: "scoped_resolve", 3: "greedy_fallback"}

    return {
        "status": "rescheduled",
        "message": f"Processed delay: train {req.train_id} +{req.delay_mins:.0f}min on {req.section_id}",
        "tier_used": max_tier,
        "tier_label": tier_label.get(max_tier, "unknown"),
        "diffs": diffs,
        "blocks_affected": len(diffs),
    }
