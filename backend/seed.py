"""
RAIL-OPS — Database Seed Script.

Loads all CSVs, runs XGBoost scoring, and persists to SQLite.
Run once: python seed.py
"""
import sys
import os

# Ensure backend dir is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from config import DB_PATH
from database import Base
from models import BlockSection, Defect, BlockWindow, PackedTask, DelayEvent, User
from services.ingestion import run_full_ingestion
from services.criticality import load_model

# Seed delay events (sample data for live feed demo)
from datetime import datetime, timedelta
import json


def seed_delay_events(session: Session):
    """Seed sample delay events for the live feed demo."""
    now = datetime.utcnow()
    events = [
        DelayEvent(
            id="DLY-001",
            train_id="12001",
            train_name="Bhopal Shatabdi Express",
            delay_mins=185,
            corridor_section_id="BPL-DIV-SEC-004",
            corridor_section_name="BPL-DIV-SEC-004",
            corridor_key="BPL-ET",
            window_opened_mins=120,
            window_start=now + timedelta(hours=1),
            status="open",
            created_at=now - timedelta(minutes=15),
            suggested_tasks_json=json.dumps([
                {"defect_id": "TMS-2026-16", "department": "TMS", "description": "USFD Overdue — BPL-DIV-SEC-004", "est_duration_mins": 120, "criticality_score": 88, "sequence_order": 1},
                {"defect_id": "SMMS-2026-9", "department": "SMMS", "description": "Track Circuit check — BPL-DIV-SEC-004", "est_duration_mins": 45, "criticality_score": 72, "sequence_order": 2},
            ]),
        ),
        DelayEvent(
            id="DLY-002",
            train_id="11077",
            train_name="Jhelum Express (Goods)",
            delay_mins=210,
            corridor_section_id="BPL-DIV-SEC-007",
            corridor_section_name="BPL-DIV-SEC-007",
            corridor_key="BPL-ET",
            window_opened_mins=150,
            window_start=now + timedelta(hours=2),
            status="open",
            created_at=now - timedelta(minutes=8),
            suggested_tasks_json=json.dumps([
                {"defect_id": "TMS-2026-2", "department": "TMS", "description": "USFD Overdue — BPL-DIV-SEC-007", "est_duration_mins": 45, "criticality_score": 91, "sequence_order": 1},
                {"defect_id": "TDMS-2026-7", "department": "TDMS", "description": "Mast Alignment — BPL-DIV-SEC-007", "est_duration_mins": 90, "criticality_score": 65, "sequence_order": 2},
                {"defect_id": "SMMS-2026-25", "department": "SMMS", "description": "Signal Aspect — BPL-DIV-SEC-007", "est_duration_mins": 30, "criticality_score": 55, "sequence_order": 3},
            ]),
        ),
        DelayEvent(
            id="DLY-003",
            train_id="12627",
            train_name="Karnataka Express",
            delay_mins=95,
            corridor_section_id="BPL-DIV-SEC-032",
            corridor_section_name="BPL-DIV-SEC-032",
            corridor_key="BPL-ET",
            window_opened_mins=60,
            window_start=now + timedelta(hours=3),
            status="open",
            created_at=now - timedelta(minutes=3),
            suggested_tasks_json=json.dumps([
                {"defect_id": "TMS-2026-1", "department": "TMS", "description": "Ballast Packing — BPL-DIV-SEC-032", "est_duration_mins": 60, "criticality_score": 82, "sequence_order": 1},
            ]),
        ),
        DelayEvent(
            id="DLY-004",
            train_id="18237",
            train_name="Chhattisgarh Express",
            delay_mins=145,
            corridor_section_id="BPL-DIV-SEC-018",
            corridor_section_name="BPL-DIV-SEC-018",
            corridor_key="BPL-ET",
            window_opened_mins=90,
            window_start=now + timedelta(hours=4),
            status="open",
            created_at=now,
            suggested_tasks_json=json.dumps([
                {"defect_id": "TMS-2026-24", "department": "TMS", "description": "Ballast Packing — BPL-DIV-SEC-018", "est_duration_mins": 120, "criticality_score": 78, "sequence_order": 1},
                {"defect_id": "TDMS-2026-19", "department": "TDMS", "description": "Wire Tensioning — BPL-DIV-SEC-018", "est_duration_mins": 60, "criticality_score": 62, "sequence_order": 2},
            ]),
        ),
    ]
    for e in events:
        session.add(e)
    print(f"[Seed] Added {len(events)} sample delay events")


def seed_sample_blocks(session: Session):
    """Seed a few sample block windows for the planner demo."""
    now = datetime.utcnow()
    monday = now - timedelta(days=now.weekday())
    monday = monday.replace(hour=9, minute=0, second=0, microsecond=0)

    blocks_data = [
        {
            "id": "BLK-BPL-001",
            "corridor_section_id": "BPL-DIV-SEC-004",
            "corridor_section_name": "BPL-DIV-SEC-004",
            "corridor_key": "BPL-ET",
            "start": monday,
            "duration": 180,
            "tasks": [
                {"defect_id": "TMS-2026-16", "department": "TMS", "description": "USFD Overdue — BPL-DIV-SEC-004", "est_duration_mins": 120, "criticality_score": 95, "sequence_order": 1},
                {"defect_id": "SMMS-2026-9", "department": "SMMS", "description": "Track Circuit — BPL-DIV-SEC-004", "est_duration_mins": 45, "criticality_score": 88, "sequence_order": 2},
                {"defect_id": "TDMS-2026-4", "department": "TDMS", "description": "Wire Tensioning — BPL-DIV-SEC-004", "est_duration_mins": 90, "criticality_score": 76, "sequence_order": 3},
            ],
            "multiplier": 2.75,
            "status": "pending",
        },
        {
            "id": "BLK-BPL-002",
            "corridor_section_id": "BPL-DIV-SEC-007",
            "corridor_section_name": "BPL-DIV-SEC-007",
            "corridor_key": "BPL-ET",
            "start": monday + timedelta(days=1, hours=5),
            "duration": 150,
            "tasks": [
                {"defect_id": "TMS-2026-2", "department": "TMS", "description": "USFD Overdue — BPL-DIV-SEC-007", "est_duration_mins": 45, "criticality_score": 92, "sequence_order": 1},
                {"defect_id": "SMMS-2026-25", "department": "SMMS", "description": "Signal Aspect — BPL-DIV-SEC-007", "est_duration_mins": 30, "criticality_score": 74, "sequence_order": 2},
            ],
            "multiplier": 1.86,
            "status": "approved",
        },
        {
            "id": "BLK-BPL-003",
            "corridor_section_id": "BPL-DIV-SEC-032",
            "corridor_section_name": "BPL-DIV-SEC-032",
            "corridor_key": "BPL-ET",
            "start": monday + timedelta(days=3, hours=1),
            "duration": 120,
            "tasks": [
                {"defect_id": "TMS-2026-1", "department": "TMS", "description": "Ballast Packing — BPL-DIV-SEC-032", "est_duration_mins": 60, "criticality_score": 93, "sequence_order": 1},
                {"defect_id": "TDMS-2026-23", "department": "TDMS", "description": "Insulator Flashover — BPL-DIV-SEC-032", "est_duration_mins": 150, "criticality_score": 85, "sequence_order": 2},
                {"defect_id": "SMMS-2026-23", "department": "SMMS", "description": "Point Machine — BPL-DIV-SEC-032", "est_duration_mins": 60, "criticality_score": 78, "sequence_order": 3},
            ],
            "multiplier": 2.17,
            "status": "pending",
        },
    ]

    for bd in blocks_data:
        block = BlockWindow(
            id=bd["id"],
            corridor_section_id=bd["corridor_section_id"],
            corridor_section_name=bd["corridor_section_name"],
            corridor_key=bd["corridor_key"],
            start_time=bd["start"],
            end_time=bd["start"] + timedelta(minutes=bd["duration"]),
            duration_mins=bd["duration"],
            shadow_multiplier=bd["multiplier"],
            status=bd["status"],
            view="weekly",
            is_opportunistic=False,
            approved_by="Chief Controller - Bhopal" if bd["status"] == "approved" else None,
            approved_at=datetime.utcnow() if bd["status"] == "approved" else None,
        )
        session.add(block)
        session.flush()  # Get block ID

        for t in bd["tasks"]:
            task = PackedTask(
                block_id=bd["id"],
                defect_id=t["defect_id"],
                department=t["department"],
                description=t["description"],
                est_duration_mins=t["est_duration_mins"],
                criticality_score=t["criticality_score"],
                sequence_order=t["sequence_order"],
            )
            session.add(task)

    print(f"[Seed] Added {len(blocks_data)} sample block windows")


def main():
    print("=" * 60)
    print("  RAIL-OPS - Database Seed Script")
    print("=" * 60)

    # Delete existing DB if present
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"[Seed] Removed existing database: {DB_PATH}")

    # Create sync engine for seeding (simpler than async for batch)
    sync_url = f"sqlite:///{DB_PATH}"
    from sqlalchemy import create_engine
    sync_engine = create_engine(sync_url, echo=False)
    Base.metadata.create_all(sync_engine)
    print(f"[Seed] Created database at: {DB_PATH}")

    # Load model first
    load_model()

    # Run ingestion
    with Session(sync_engine) as session:
        run_full_ingestion(session)
        seed_delay_events(session)
        seed_sample_blocks(session)
        session.commit()

    print("=" * 60)
    print("  DONE - Seeding complete!")
    print(f"  Database: {DB_PATH}")
    print(f"  Size: {DB_PATH.stat().st_size / 1024 / 1024:.1f} MB")
    print("=" * 60)


if __name__ == "__main__":
    main()
