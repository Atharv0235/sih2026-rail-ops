"""
Live Feed router — WebSocket for real-time delay events + REST fallback.
Supports WebSocket push for real-time delay notifications.
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import json
import asyncio

from database import get_db, async_session
from models.delay_event import DelayEvent
from models.block import BlockWindow, PackedTask

router = APIRouter(prefix="/api/live", tags=["live"])

# ── WebSocket connection manager ──
class ConnectionManager:
    """Manages active WebSocket connections for real-time push."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Push a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.active_connections.remove(conn)


manager = ConnectionManager()


def _event_to_out(event: DelayEvent) -> dict:
    """Convert DelayEvent ORM to frontend-compatible dict."""
    try:
        suggested_tasks = json.loads(event.suggested_tasks_json) if event.suggested_tasks_json else []
    except json.JSONDecodeError:
        suggested_tasks = []

    return {
        "id": event.id,
        "train_id": event.train_id,
        "train_name": event.train_name,
        "delay_mins": event.delay_mins,
        "corridor_section_id": event.corridor_section_id,
        "corridor_section_name": event.corridor_section_name,
        "corridor_key": event.corridor_key,
        "window_opened_mins": event.window_opened_mins,
        "window_start": event.window_start.isoformat() if event.window_start else "",
        "suggested_tasks": suggested_tasks,
        "status": event.status,
        "created_at": event.created_at.isoformat() if event.created_at else "",
        "accepted_at": event.accepted_at.isoformat() if event.accepted_at else None,
        "dismissed_at": event.dismissed_at.isoformat() if event.dismissed_at else None,
    }


# ── WebSocket endpoint for real-time push ──
@router.websocket("/ws")
async def websocket_live_feed(websocket: WebSocket):
    """WebSocket endpoint for real-time delay event push."""
    await manager.connect(websocket)
    try:
        # Send current events on connect
        async with async_session() as db:
            result = await db.execute(
                select(DelayEvent).order_by(DelayEvent.created_at.desc())
            )
            events = result.scalars().all()
            await websocket.send_json({
                "type": "initial",
                "events": [_event_to_out(e) for e in events]
            })

        # Keep connection alive and wait for client messages
        while True:
            data = await websocket.receive_text()
            # Client can send "ping" to keep alive
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── REST endpoints (fallback + actions) ──
@router.get("")
async def get_live_opportunities(db: AsyncSession = Depends(get_db)):
    """Get all delay events, sorted by newest first."""
    result = await db.execute(
        select(DelayEvent).order_by(DelayEvent.created_at.desc())
    )
    events = result.scalars().all()
    return [_event_to_out(e) for e in events]


@router.post("/{event_id}/accept")
async def accept_opportunity(event_id: str, db: AsyncSession = Depends(get_db)):
    """Accept a delay event — creates an opportunistic block."""
    result = await db.execute(select(DelayEvent).where(DelayEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = "accepted"
    event.accepted_at = datetime.utcnow()

    # Create opportunistic block from the delay event
    try:
        suggested = json.loads(event.suggested_tasks_json) if event.suggested_tasks_json else []
    except json.JSONDecodeError:
        suggested = []

    new_block = BlockWindow(
        id=f"BLK-OPP-{event_id}",
        corridor_section_id=event.corridor_section_id,
        corridor_section_name=event.corridor_section_name,
        corridor_key=event.corridor_key,
        start_time=event.window_start,
        end_time=datetime.utcnow(),  # Will be calculated properly
        duration_mins=event.window_opened_mins,
        shadow_multiplier=len(suggested) if suggested else 1.0,
        status="pending",
        view="weekly",
        is_opportunistic=True,
    )
    db.add(new_block)

    # Add packed tasks
    for i, task in enumerate(suggested):
        packed = PackedTask(
            block_id=new_block.id,
            defect_id=task.get("defect_id", f"OPP-{i}"),
            department=task.get("department", "TMS"),
            description=task.get("description", ""),
            est_duration_mins=task.get("est_duration_mins", 0),
            criticality_score=task.get("criticality_score", 0),
            sequence_order=task.get("sequence_order", i + 1),
        )
        db.add(packed)

    await db.commit()

    # Broadcast to WebSocket clients
    event_out = _event_to_out(event)
    await manager.broadcast({"type": "event_accepted", "event": event_out})

    return event_out


@router.post("/{event_id}/dismiss")
async def dismiss_opportunity(event_id: str, db: AsyncSession = Depends(get_db)):
    """Dismiss a delay event."""
    result = await db.execute(select(DelayEvent).where(DelayEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = "dismissed"
    event.dismissed_at = datetime.utcnow()
    await db.commit()

    event_out = _event_to_out(event)
    await manager.broadcast({"type": "event_dismissed", "event": event_out})
    return event_out


@router.post("/{event_id}/undo")
async def undo_dismiss(event_id: str, db: AsyncSession = Depends(get_db)):
    """Undo a dismissal — re-open the event."""
    result = await db.execute(select(DelayEvent).where(DelayEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = "open"
    event.dismissed_at = None
    await db.commit()

    event_out = _event_to_out(event)
    await manager.broadcast({"type": "event_reopened", "event": event_out})
    return event_out
