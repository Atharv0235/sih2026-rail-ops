"""
Data Ingestion Service — loads CSVs, merges, scores, and writes to SQLite.

Computes all fields required by the block_planner algorithm:
  Section:  length_km, passenger_criticality, redundancy_factor
  Defect:   chainage_km, possession_type, existing_tsr_flag,
            repeat_defect_count_90d, season, days_overdue
"""
import hashlib
import pandas as pd
import numpy as np
from datetime import date, datetime
from sqlalchemy.orm import Session

from config import (
    BLOCK_SECTIONS_CSV, TMS_DEFECTS_CSV, SMMS_DEFECTS_CSV, TDMS_DEFECTS_CSV,
    DEPT_CODE_MAP, TDMS_SEVERITY_MAP,
)
from models.section import BlockSection
from models.defect import Defect
from services.criticality import score_batch, urgency_band


# ── Helpers for deterministic derivation ──

def _stable_hash(s: str) -> float:
    """Return a float in [0, 1) deterministically derived from a string."""
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF


def _derive_length_km(section_id: str) -> float:
    """Derive a plausible section length (15–50 km) from section_id."""
    return 15.0 + _stable_hash(section_id) * 35.0


def _derive_passenger_criticality(traffic_density_gmt: int) -> float:
    """Passenger criticality ∈ [0, 1] proportional to traffic density."""
    return round(min(1.0, max(0.0, traffic_density_gmt / 200.0)), 4)


def _derive_redundancy_factor(traffic_density_gmt: int) -> int:
    """High-density sections are single-line corridors (redundancy=1), else 2."""
    return 1 if traffic_density_gmt >= 140 else 2


def _derive_chainage_km(defect_id: str, section_id: str, length_km: float) -> float:
    """Deterministic chainage position within the section."""
    h = _stable_hash(f"{defect_id}:{section_id}")
    return round(0.5 + h * max(length_km - 1.0, 1.0), 2)


def _derive_possession_type(department: str, power_block_req: bool) -> str:
    """Map department + power_block_req to block_planner PossessionType value."""
    if power_block_req:
        return "ohe"
    return {"TMS": "track", "SMMS": "signal", "TDMS": "ohe"}.get(department, "track")


def _derive_tsr_flag(severity_normalized: int) -> int:
    """Temporary Speed Restriction flag: 1 if severity ≥ 7."""
    return 1 if severity_normalized >= 7 else 0


def _derive_repeat_count(defect_id: str) -> int:
    """Deterministic repeat-defect count in [0, 3]."""
    return int(_stable_hash(defect_id) * 4) % 4


def _derive_season(detected: date) -> str:
    """Season from month: Jun–Sep = monsoon, Nov–Feb = winter, Mar–May = summer, else dry."""
    m = detected.month
    if 6 <= m <= 9:
        return "monsoon"
    elif m in (11, 12, 1, 2):
        return "winter"
    elif 3 <= m <= 5:
        return "summer"
    return "dry"


def _derive_days_overdue(days_pending: int) -> float:
    """Overdue = days beyond a 14-day acceptable threshold."""
    return max(0.0, float(days_pending - 14))


# ── Section loader ──

# Section length cache for chainage derivation
_section_lengths: dict[str, float] = {}


def load_sections(session: Session) -> dict[str, dict]:
    """Load block sections CSV and return a lookup dict keyed by section_id."""
    df = pd.read_csv(BLOCK_SECTIONS_CSV)
    lookup = {}
    for _, row in df.iterrows():
        sid = row["section_id"]
        gmt = int(row["traffic_density_gmt"])

        length_km = round(_derive_length_km(sid), 2)
        pax_crit = _derive_passenger_criticality(gmt)
        redundancy = _derive_redundancy_factor(gmt)

        _section_lengths[sid] = length_km  # cache for defect chainage

        section = BlockSection(
            section_id=sid,
            division=row["division"],
            traffic_density_gmt=gmt,
            max_speed_kmh=int(row["max_speed_kmh"]),
            length_km=length_km,
            passenger_criticality=pax_crit,
            redundancy_factor=redundancy,
        )
        session.add(section)
        lookup[sid] = {
            "traffic_density_gmt": gmt,
            "max_speed_kmh": int(row["max_speed_kmh"]),
            "length_km": length_km,
        }
    print(f"[Ingestion] Loaded {len(lookup)} block sections (with length_km, passenger_criticality, redundancy_factor)")
    return lookup


# ── Defect parsers ──

def _parse_date(val) -> date:
    """Parse a date string to a date object."""
    if isinstance(val, str):
        return datetime.strptime(val, "%Y-%m-%d").date()
    return val


def _enrich_row(row: dict) -> dict:
    """Add block_planner-specific derived fields to a defect row dict."""
    sid = row["section_id"]
    length_km = _section_lengths.get(sid, 25.0)

    row["chainage_km"] = _derive_chainage_km(row["id"], sid, length_km)
    row["possession_type"] = _derive_possession_type(row["department"], row["power_block_req"])
    row["existing_tsr_flag"] = _derive_tsr_flag(row["severity_normalized"])
    row["repeat_defect_count_90d"] = _derive_repeat_count(row["id"])
    row["season"] = _derive_season(row["date_detected"])
    row["days_overdue"] = _derive_days_overdue(row["days_pending"])
    return row


def ingest_tms(sections: dict) -> list[dict]:
    """Parse TMS defects CSV into unified row dicts."""
    df = pd.read_csv(TMS_DEFECTS_CSV)
    today = date.today()
    rows = []
    for _, r in df.iterrows():
        sec = sections.get(r["section_id"], {"traffic_density_gmt": 100, "max_speed_kmh": 100})
        detected = _parse_date(r["date_detected"])
        days = (today - detected).days
        sev = int(r["severity_level"])
        row = {
            "id": r["defect_id"],
            "department": "TMS",
            "section_id": r["section_id"],
            "defect_category": r["defect_category"],
            "severity_raw": float(sev),
            "power_block_req": False,
            "date_detected": detected,
            "est_duration_mins": int(r["est_duration_mins"]),
            "status": r["status"],
            "days_pending": max(days, 0),
            "severity_normalized": sev,
            "dept_code": DEPT_CODE_MAP["TMS"],
            "traffic_density_gmt": sec["traffic_density_gmt"],
            "max_speed_kmh": sec["max_speed_kmh"],
            "failure_prob": 0.0,
        }
        rows.append(_enrich_row(row))
    print(f"[Ingestion] Parsed {len(rows)} TMS defects")
    return rows


def ingest_smms(sections: dict) -> list[dict]:
    """Parse SMMS defects CSV into unified row dicts."""
    df = pd.read_csv(SMMS_DEFECTS_CSV)
    today = date.today()
    rows = []
    for _, r in df.iterrows():
        sec = sections.get(r["section_id"], {"traffic_density_gmt": 100, "max_speed_kmh": 100})
        detected = _parse_date(r["date_due"])
        days = (today - detected).days
        prob = float(r["failure_probability"])
        sev = int(round(prob * 10))  # Normalize probability to 0-10 int
        row = {
            "id": r["defect_id"],
            "department": "SMMS",
            "section_id": r["section_id"],
            "defect_category": r["asset_type"],
            "severity_raw": prob,
            "power_block_req": False,
            "date_detected": detected,
            "est_duration_mins": int(r["est_duration_mins"]),
            "status": r["status"],
            "days_pending": max(days, 0),
            "severity_normalized": sev,
            "dept_code": DEPT_CODE_MAP["SMMS"],
            "traffic_density_gmt": sec["traffic_density_gmt"],
            "max_speed_kmh": sec["max_speed_kmh"],
            "failure_prob": prob,
        }
        rows.append(_enrich_row(row))
    print(f"[Ingestion] Parsed {len(rows)} SMMS defects")
    return rows


def ingest_tdms(sections: dict) -> list[dict]:
    """Parse TDMS defects CSV into unified row dicts."""
    df = pd.read_csv(TDMS_DEFECTS_CSV)
    today = date.today()
    rows = []
    for _, r in df.iterrows():
        sec = sections.get(r["section_id"], {"traffic_density_gmt": 100, "max_speed_kmh": 100})
        detected = _parse_date(r["date_detected"])
        days = (today - detected).days
        sev = TDMS_SEVERITY_MAP.get(r["defect_category"], 5)
        power = str(r["power_block_req"]).strip().lower() == "true"
        row = {
            "id": r["defect_id"],
            "department": "TDMS",
            "section_id": r["section_id"],
            "defect_category": r["defect_category"],
            "severity_raw": float(sev),
            "power_block_req": power,
            "date_detected": detected,
            "est_duration_mins": int(r["est_duration_mins"]),
            "status": r["status"],
            "days_pending": max(days, 0),
            "severity_normalized": sev,
            "dept_code": DEPT_CODE_MAP["TDMS"],
            "traffic_density_gmt": sec["traffic_density_gmt"],
            "max_speed_kmh": sec["max_speed_kmh"],
            "failure_prob": 0.0,
        }
        rows.append(_enrich_row(row))
    print(f"[Ingestion] Parsed {len(rows)} TDMS defects")
    return rows


def score_and_persist(session: Session, all_rows: list[dict]):
    """Run XGBoost scoring on all defects and persist to DB."""
    if not all_rows:
        return

    SEASON_ENCODE = {"dry": 0, "summer": 1, "winter": 2, "monsoon": 3}

    # Build 10-feature matrix for batch scoring (matches retrained model)
    features = np.array([
        [r["dept_code"], r["severity_normalized"], r["days_pending"],
         r["est_duration_mins"], r["traffic_density_gmt"], r["max_speed_kmh"],
         r["existing_tsr_flag"], r["repeat_defect_count_90d"],
         SEASON_ENCODE.get(r["season"], 0),
         1 if r["traffic_density_gmt"] >= 140 else 2]
        for r in all_rows
    ], dtype=np.float32)

    scores = score_batch(features)

    for row, score in zip(all_rows, scores):
        defect = Defect(
            id=row["id"],
            department=row["department"],
            section_id=row["section_id"],
            defect_category=row["defect_category"],
            severity_raw=row["severity_raw"],
            power_block_req=row["power_block_req"],
            date_detected=row["date_detected"],
            est_duration_mins=row["est_duration_mins"],
            status=row["status"],
            criticality_score=round(float(score), 2),
            urgency_band=urgency_band(float(score)),
            days_pending=row["days_pending"],
            severity_normalized=row["severity_normalized"],
            # ── block_planner fields ──
            chainage_km=row["chainage_km"],
            possession_type=row["possession_type"],
            existing_tsr_flag=row["existing_tsr_flag"],
            repeat_defect_count_90d=row["repeat_defect_count_90d"],
            season=row["season"],
            days_overdue=row["days_overdue"],
        )
        session.add(defect)

    print(f"[Ingestion] Scored and queued {len(all_rows)} defects for DB write")


def run_full_ingestion(session: Session):
    """Full pipeline: load sections → parse all CSVs → score → persist."""
    sections = load_sections(session)
    tms_rows = ingest_tms(sections)
    smms_rows = ingest_smms(sections)
    tdms_rows = ingest_tdms(sections)
    all_rows = tms_rows + smms_rows + tdms_rows
    score_and_persist(session, all_rows)
    session.commit()
    print(f"[Ingestion] DONE - Full ingestion complete - {len(all_rows)} defects in database")
