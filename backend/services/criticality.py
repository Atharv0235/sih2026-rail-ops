"""
XGBoost Criticality Scoring Service (v2 — 10-feature model).

Loads the pre-trained model and scores defects with a 0-100 criticality score.

Features (10):
  dept_code, severity, days_pending, est_duration_mins,
  traffic_density_gmt, max_speed_kmh,
  existing_tsr_flag, repeat_defect_count_90d, season_encoded, redundancy_factor
"""
import numpy as np
import xgboost as xgb
from config import XGBOOST_MODEL_PATH, URGENCY_CRITICAL, URGENCY_HIGH, URGENCY_MEDIUM

# ── Season encoder (must match training script) ──
SEASON_ENCODE = {"dry": 0, "summer": 1, "winter": 2, "monsoon": 3}

# ── Feature names (must match training script exactly) ──
FEATURE_NAMES_10 = [
    "dept_code", "severity", "days_pending",
    "est_duration_mins", "traffic_density_gmt", "max_speed_kmh",
    "existing_tsr_flag", "repeat_defect_count_90d",
    "season_encoded", "redundancy_factor",
]

# Legacy 6-feature names (for backward compatibility during transition)
FEATURE_NAMES_6 = [
    "dept_code", "severity", "days_pending",
    "est_duration_mins", "traffic_density_gmt", "max_speed_kmh",
]

# ── Module-level model singleton ──
_model: xgb.Booster | None = None
_num_features: int = 0  # detected at load time


def load_model() -> xgb.Booster:
    """Load the XGBoost model from JSON (called once at app startup)."""
    global _model, _num_features
    if _model is None:
        _model = xgb.Booster()
        _model.load_model(str(XGBOOST_MODEL_PATH))
        # Detect feature count from model metadata
        try:
            _num_features = int(_model.num_features())
        except Exception:
            _num_features = 6  # fallback to old model
        print(f"[Criticality] XGBoost model loaded ({_num_features} features) from {XGBOOST_MODEL_PATH}")
    return _model


def score_batch(features: np.ndarray) -> np.ndarray:
    """
    Score a batch of defects.

    Args:
        features: ndarray of shape (N, 6) or (N, 10) depending on model version.
            6-feature: [dept_code, severity, days_pending, est_duration_mins,
                        traffic_density_gmt, max_speed_kmh]
            10-feature: above + [existing_tsr_flag, repeat_defect_count_90d,
                         season_encoded, redundancy_factor]

    Returns:
        ndarray of shape (N,) with criticality scores normalized to 0-100.
    """
    model = load_model()
    n_cols = features.shape[1] if features.ndim > 1 else 1

    # Auto-detect: if we have a 10-feature model but only got 6 features,
    # pad with zeros (safe defaults) for backward compatibility
    if _num_features == 10 and n_cols == 6:
        padding = np.zeros((features.shape[0], 4), dtype=np.float32)
        features = np.hstack([features, padding])
        n_cols = 10

    # Reverse compat: old 6-feature model but 10 features passed —
    # truncate to the first 6 columns (extra features ignored until retrained)
    if _num_features == 6 and n_cols == 10:
        features = features[:, :6]
        n_cols = 6

    if n_cols == 10:
        feature_names = FEATURE_NAMES_10
    else:
        feature_names = FEATURE_NAMES_6

    dmatrix = xgb.DMatrix(features, feature_names=feature_names)
    raw_scores = model.predict(dmatrix)

    # Normalize to 0-100
    # These bounds should be updated after re-training (printed by train script)
    s_min = float(raw_scores.min()) if len(raw_scores) > 50 else -35.0
    s_max = float(raw_scores.max()) if len(raw_scores) > 50 else 30.0

    # Prevent division by zero
    span = max(s_max - s_min, 1e-6)
    normalized = ((raw_scores - s_min) / span) * 100
    return np.clip(normalized, 0, 100)


def score_batch_10(features_10: np.ndarray) -> np.ndarray:
    """Score using the full 10-feature vector. Preferred for new code."""
    return score_batch(features_10)


def score_single(dept_code: int, severity: int, days_pending: int,
                 est_duration_mins: int, traffic_density_gmt: int,
                 max_speed_kmh: int,
                 existing_tsr_flag: int = 0,
                 repeat_defect_count_90d: int = 0,
                 season_encoded: int = 0,
                 redundancy_factor: int = 2) -> float:
    """Score a single defect and return normalized 0-100 score."""
    features = np.array([[
        dept_code, severity, days_pending,
        est_duration_mins, traffic_density_gmt, max_speed_kmh,
        existing_tsr_flag, repeat_defect_count_90d,
        season_encoded, redundancy_factor,
    ]], dtype=np.float32)
    return float(score_batch(features)[0])


def urgency_band(score: float) -> str:
    """Map a 0-100 criticality score to an urgency band."""
    if score >= URGENCY_CRITICAL:
        return "critical"
    elif score >= URGENCY_HIGH:
        return "high"
    elif score >= URGENCY_MEDIUM:
        return "medium"
    else:
        return "low"


def decompose_score(score: float, severity: int, days_pending: int,
                    traffic_density: int, failure_prob: float) -> dict:
    """
    Decompose an overall score into component sub-scores for the frontend's
    CriticalityScore interface (overall, severity, overdue_factor, traffic_density, failure_risk).
    Uses weighted attribution.
    """
    # Approximate component contributions
    sev_contrib = min(severity * 10, 100)
    overdue_contrib = min(days_pending * 2, 100)
    traffic_contrib = min(traffic_density * 0.6, 100)
    failure_contrib = min(failure_prob * 100, 100)

    return {
        "overall": round(score, 1),
        "severity": round(sev_contrib, 1),
        "overdue_factor": round(overdue_contrib, 1),
        "traffic_density": round(traffic_contrib, 1),
        "failure_risk": round(failure_contrib, 1),
    }
