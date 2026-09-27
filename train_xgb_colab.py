"""
RAIL-OPS — XGBoost Criticality Model Training Script (Colab Edition)
=====================================================================

HOW TO USE ON COLAB:
1. Upload these 4 CSV files to your Colab session:
   - large_block_sections.csv
   - large_tms_defects.csv
   - large_smms_defects.csv
   - large_tdms_defects.csv

2. Run all cells. The trained model will be saved as
   'railway_criticality_xgb.json' and auto-downloaded.

3. Copy the downloaded file to:
   Railway_block/models/railway_criticality_xgb.json
   (overwriting the old one)

FEATURES (10):
   0: dept_code              (TMS=0, SMMS=1, TDMS=2)
   1: severity               (normalized 0-10 int)
   2: days_pending            (int, days since detection)
   3: est_duration_mins       (int)
   4: traffic_density_gmt     (int, from section)
   5: max_speed_kmh           (int, from section)
   6: existing_tsr_flag       (0 or 1)
   7: repeat_defect_count_90d (0-3)
   8: season_encoded          (monsoon=3, winter=2, summer=1, dry=0)
   9: redundancy_factor       (1 or 2)
"""

# ── Cell 1: Install dependencies ──
# !pip install xgboost scikit-learn pandas numpy matplotlib

import hashlib
import numpy as np
import pandas as pd
import xgboost as xgb
from datetime import date, datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import matplotlib.pyplot as plt

print("✅ All imports successful")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 2: Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Update these paths if your CSVs are in a different location on Colab
BLOCK_SECTIONS_CSV = "large_block_sections.csv"
TMS_DEFECTS_CSV    = "large_tms_defects.csv"
SMMS_DEFECTS_CSV   = "large_smms_defects.csv"
TDMS_DEFECTS_CSV   = "large_tdms_defects.csv"

OUTPUT_MODEL_PATH  = "railway_criticality_xgb.json"

DEPT_CODE_MAP = {"TMS": 0, "SMMS": 1, "TDMS": 2}

TDMS_SEVERITY_MAP = {
    "Wire Tensioning": 5,
    "Jumper Wire Check": 6,
    "Mast Alignment": 7,
    "Insulator Flashover": 9,
}

SEASON_ENCODE = {"dry": 0, "summer": 1, "winter": 2, "monsoon": 3}

FEATURE_NAMES = [
    "dept_code", "severity", "days_pending",
    "est_duration_mins", "traffic_density_gmt", "max_speed_kmh",
    "existing_tsr_flag", "repeat_defect_count_90d",
    "season_encoded", "redundancy_factor",
]

print(f"📋 Feature count: {len(FEATURE_NAMES)}")
print(f"📋 Features: {FEATURE_NAMES}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 3: Helper functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def stable_hash(s: str) -> float:
    """Deterministic float in [0,1) from a string."""
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF


def derive_season(detected: date) -> str:
    m = detected.month
    if 6 <= m <= 9:
        return "monsoon"
    elif m in (11, 12, 1, 2):
        return "winter"
    elif 3 <= m <= 5:
        return "summer"
    return "dry"


def derive_tsr_flag(severity_normalized: int) -> int:
    return 1 if severity_normalized >= 7 else 0


def derive_repeat_count(defect_id: str) -> int:
    return int(stable_hash(defect_id) * 4) % 4


def derive_redundancy(gmt: int) -> int:
    return 1 if gmt >= 140 else 2


def parse_date(val) -> date:
    if isinstance(val, str):
        return datetime.strptime(val, "%Y-%m-%d").date()
    return val


print("✅ Helpers defined")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 4: Load & parse all CSVs
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# -- Sections --
sections_df = pd.read_csv(BLOCK_SECTIONS_CSV)
section_lookup = {}
for _, row in sections_df.iterrows():
    sid = row["section_id"]
    gmt = int(row["traffic_density_gmt"])
    section_lookup[sid] = {
        "traffic_density_gmt": gmt,
        "max_speed_kmh": int(row["max_speed_kmh"]),
        "redundancy_factor": derive_redundancy(gmt),
    }
print(f"📂 Loaded {len(section_lookup)} sections")

# -- TMS defects --
today = date.today()
all_rows = []

tms_df = pd.read_csv(TMS_DEFECTS_CSV)
for _, r in tms_df.iterrows():
    sec = section_lookup.get(r["section_id"], {"traffic_density_gmt": 100, "max_speed_kmh": 100, "redundancy_factor": 2})
    detected = parse_date(r["date_detected"])
    days = max((today - detected).days, 0)
    sev = int(r["severity_level"])
    all_rows.append({
        "id": r["defect_id"],
        "dept_code": DEPT_CODE_MAP["TMS"],
        "severity": sev,
        "days_pending": days,
        "est_duration_mins": int(r["est_duration_mins"]),
        "traffic_density_gmt": sec["traffic_density_gmt"],
        "max_speed_kmh": sec["max_speed_kmh"],
        "existing_tsr_flag": derive_tsr_flag(sev),
        "repeat_defect_count_90d": derive_repeat_count(r["defect_id"]),
        "season": derive_season(detected),
        "redundancy_factor": sec["redundancy_factor"],
        "failure_prob": 0.0,
    })
print(f"  TMS: {len(tms_df)} rows")

# -- SMMS defects --
smms_df = pd.read_csv(SMMS_DEFECTS_CSV)
for _, r in smms_df.iterrows():
    sec = section_lookup.get(r["section_id"], {"traffic_density_gmt": 100, "max_speed_kmh": 100, "redundancy_factor": 2})
    detected = parse_date(r["date_due"])
    days = max((today - detected).days, 0)
    prob = float(r["failure_probability"])
    sev = int(round(prob * 10))
    all_rows.append({
        "id": r["defect_id"],
        "dept_code": DEPT_CODE_MAP["SMMS"],
        "severity": sev,
        "days_pending": days,
        "est_duration_mins": int(r["est_duration_mins"]),
        "traffic_density_gmt": sec["traffic_density_gmt"],
        "max_speed_kmh": sec["max_speed_kmh"],
        "existing_tsr_flag": derive_tsr_flag(sev),
        "repeat_defect_count_90d": derive_repeat_count(r["defect_id"]),
        "season": derive_season(detected),
        "redundancy_factor": sec["redundancy_factor"],
        "failure_prob": prob,
    })
print(f"  SMMS: {len(smms_df)} rows")

# -- TDMS defects --
tdms_df = pd.read_csv(TDMS_DEFECTS_CSV)
for _, r in tdms_df.iterrows():
    sec = section_lookup.get(r["section_id"], {"traffic_density_gmt": 100, "max_speed_kmh": 100, "redundancy_factor": 2})
    detected = parse_date(r["date_detected"])
    days = max((today - detected).days, 0)
    sev = TDMS_SEVERITY_MAP.get(r["defect_category"], 5)
    all_rows.append({
        "id": r["defect_id"],
        "dept_code": DEPT_CODE_MAP["TDMS"],
        "severity": sev,
        "days_pending": days,
        "est_duration_mins": int(r["est_duration_mins"]),
        "traffic_density_gmt": sec["traffic_density_gmt"],
        "max_speed_kmh": sec["max_speed_kmh"],
        "existing_tsr_flag": derive_tsr_flag(sev),
        "repeat_defect_count_90d": derive_repeat_count(r["defect_id"]),
        "season": derive_season(detected),
        "redundancy_factor": sec["redundancy_factor"],
        "failure_prob": 0.0,
    })
print(f"  TDMS: {len(tdms_df)} rows")

print(f"\n📊 Total defects: {len(all_rows)}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 5: Feature matrix + target generation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

df = pd.DataFrame(all_rows)
df["season_encoded"] = df["season"].map(SEASON_ENCODE)

# Build feature matrix (10 features)
X = df[FEATURE_NAMES].values.astype(np.float32)

# ── Generate ground-truth target: synthetic criticality score [0, 100] ──
# Weighted formula simulating real-world criticality assessment:
#   - High severity -> high score
#   - Long pending / overdue -> urgency spike
#   - High traffic density -> greater consequence
#   - Active TSR -> very critical (infrastructure already degraded)
#   - Repeat defects -> systemic issue, higher risk
#   - Monsoon season -> accelerated deterioration
#   - Low redundancy (=1) -> no alternative route, very critical

np.random.seed(42)

severity_contrib    = df["severity"].values / 10.0                              # [0, 1]
overdue_contrib     = np.clip(df["days_pending"].values / 60.0, 0, 1)           # [0, 1]
traffic_contrib     = np.clip(df["traffic_density_gmt"].values / 200.0, 0, 1)   # [0, 1]
tsr_contrib         = df["existing_tsr_flag"].values.astype(float)              # 0 or 1
repeat_contrib      = df["repeat_defect_count_90d"].values / 3.0                # [0, 1]
season_contrib      = df["season_encoded"].values / 3.0                         # [0, 1]
redundancy_contrib  = (2 - df["redundancy_factor"].values).astype(float)        # 0 or 1 (1=no alternative)
duration_contrib    = np.clip(df["est_duration_mins"].values / 180.0, 0, 1)     # [0, 1]

# Weighted combination (weights sum to ~1.0 for interpretability)
raw_score = (
    0.22 * severity_contrib
    + 0.18 * overdue_contrib
    + 0.15 * traffic_contrib
    + 0.12 * tsr_contrib
    + 0.10 * repeat_contrib
    + 0.08 * season_contrib
    + 0.08 * redundancy_contrib
    + 0.07 * duration_contrib
)

# Scale to [0, 100] and add realistic noise
y = np.clip(raw_score * 100 + np.random.normal(0, 3, size=len(raw_score)), 0, 100).astype(np.float32)

print(f"✅ Feature matrix shape: {X.shape}")
print(f"✅ Target distribution: min={y.min():.1f}, mean={y.mean():.1f}, max={y.max():.1f}, std={y.std():.1f}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 6: Train/test split & XGBoost training
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=FEATURE_NAMES)
dtest  = xgb.DMatrix(X_test,  label=y_test,  feature_names=FEATURE_NAMES)

params = {
    "objective": "reg:squarederror",
    "max_depth": 6,
    "learning_rate": 0.08,
    "subsample": 0.85,
    "colsample_bytree": 0.85,
    "min_child_weight": 5,
    "gamma": 0.1,
    "reg_alpha": 0.5,
    "reg_lambda": 1.0,
    "eval_metric": "mae",
    "seed": 42,
    "verbosity": 1,
}

print("🚀 Training XGBoost model...")
print(f"   Train samples: {len(X_train):,}")
print(f"   Test samples:  {len(X_test):,}")
print(f"   Features:      {len(FEATURE_NAMES)}")

evals_result = {}
model = xgb.train(
    params,
    dtrain,
    num_boost_round=300,
    evals=[(dtrain, "train"), (dtest, "val")],
    evals_result=evals_result,
    early_stopping_rounds=30,
    verbose_eval=50,
)

print(f"\n✅ Training complete! Best iteration: {model.best_iteration}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 7: Evaluation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

y_pred = model.predict(dtest)
mae = mean_absolute_error(y_test, y_pred)
r2  = r2_score(y_test, y_pred)

print(f"\n📈 Model Evaluation:")
print(f"   MAE:  {mae:.2f}  (lower is better)")
print(f"   R²:   {r2:.4f}  (closer to 1.0 is better)")
print(f"   RMSE: {np.sqrt(np.mean((y_test - y_pred) ** 2)):.2f}")

# Score distribution check
print(f"\n📊 Prediction distribution:")
print(f"   min={y_pred.min():.1f}, mean={y_pred.mean():.1f}, max={y_pred.max():.1f}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 8: Feature importance plot
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

importance = model.get_score(importance_type="gain")
# Sort by importance
sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)
names = [x[0] for x in sorted_imp]
values = [x[1] for x in sorted_imp]

plt.figure(figsize=(10, 6))
plt.barh(names[::-1], values[::-1], color="#4F46E5")
plt.xlabel("Gain (Feature Importance)")
plt.title("XGBoost Feature Importance — Railway Criticality Model (10 Features)")
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=150)
plt.show()
print("📊 Feature importance plot saved to feature_importance.png")

# Training curve
plt.figure(figsize=(10, 5))
plt.plot(evals_result["train"]["mae"], label="Train MAE", alpha=0.8)
plt.plot(evals_result["val"]["mae"], label="Val MAE", alpha=0.8)
plt.xlabel("Boosting Round")
plt.ylabel("MAE")
plt.title("Training Curve — XGBoost Criticality Model")
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("training_curve.png", dpi=150)
plt.show()
print("📊 Training curve saved to training_curve.png")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cell 9: Save model & download
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

model.save_model(OUTPUT_MODEL_PATH)
print(f"\n💾 Model saved to: {OUTPUT_MODEL_PATH}")

# Print the normalization bounds for the backend
# (The backend uses these to map raw XGBoost output -> 0-100)
all_dmatrix = xgb.DMatrix(X, feature_names=FEATURE_NAMES)
all_preds = model.predict(all_dmatrix)
print(f"\n🔧 BACKEND CONFIG — Update these in backend/services/criticality.py:")
print(f"   s_min = {all_preds.min():.1f}")
print(f"   s_max = {all_preds.max():.1f}")
print(f"   (These are used to normalize raw XGBoost output to 0-100)")

# Auto-download on Colab
try:
    from google.colab import files
    files.download(OUTPUT_MODEL_PATH)
    files.download("feature_importance.png")
    files.download("training_curve.png")
    print("\n📥 Files downloaded!")
except ImportError:
    print(f"\n📁 Not running on Colab — model saved locally to {OUTPUT_MODEL_PATH}")

print("\n" + "=" * 60)
print("  ✅ DONE — Copy railway_criticality_xgb.json to:")
print("     Railway_block/models/railway_criticality_xgb.json")
print("=" * 60)
