"""
RAIL-OPS Backend — Configuration
"""
import os
from pathlib import Path

# ── Paths ──
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATASETS_DIR = PROJECT_ROOT / "datasets"
MODELS_DIR = PROJECT_ROOT / "models"

# ── Database ──
DB_PATH = BASE_DIR / "railway.db"
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# ── Dataset files ──
BLOCK_SECTIONS_CSV = DATASETS_DIR / "large_block_sections.csv"
TMS_DEFECTS_CSV = DATASETS_DIR / "large_tms_defects.csv"
SMMS_DEFECTS_CSV = DATASETS_DIR / "large_smms_defects.csv"
TDMS_DEFECTS_CSV = DATASETS_DIR / "large_tdms_defects.csv"

# ── ML Model ──
XGBOOST_MODEL_PATH = MODELS_DIR / "railway_criticality_xgb.json"

# ── Department Codes (for XGBoost feature) ──
DEPT_CODE_MAP = {"TMS": 0, "SMMS": 1, "TDMS": 2}

# ── TDMS severity mapping (category → severity 1-10) ──
TDMS_SEVERITY_MAP = {
    "Wire Tensioning": 5,
    "Jumper Wire Check": 6,
    "Mast Alignment": 7,
    "Insulator Flashover": 9,
}

# ── Urgency band thresholds ──
URGENCY_CRITICAL = 90
URGENCY_HIGH = 60
URGENCY_MEDIUM = 30

# ── CORS ──
_default_origins = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:8000"]
_env_origins = os.environ.get("CORS_ORIGINS", "")
CORS_ORIGINS = _default_origins + [o.strip() for o in _env_origins.split(",") if o.strip()]
