"""Component A — Criticality scoring (Layer A + Layer B) and bundling."""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Callable, Optional, Sequence

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from block_planner.data_gen import LAMBDA_BY_TYPE
from block_planner.models import (
    POSSESSION_COMPAT,
    MaintenanceTask,
    PossessionType,
    Section,
    SuperTask,
)

# ---------------------------------------------------------------------------
# Layer A — rule-based (always-on)
# ---------------------------------------------------------------------------

DEFAULT_BETA = 1.5
DEFAULT_WEIGHTS = (0.25, 0.25, 0.25, 0.25)  # w1..w4
STATUTORY_URGENCY_SCALE = 50.0
BUNDLING_BONUS = 8.0
DEFAULT_GAP_KM = 2.0


def age_days(task: MaintenanceTask) -> float:
    """Days since detection (TMS/TDMS) or days overdue (SMMS), whichever is larger signal."""
    return max(task.date_detected_days_ago, task.days_overdue)


def p_failure(task: MaintenanceTask, beta: float = DEFAULT_BETA) -> float:
    """P_failure = 1 - exp(-λ_type · age_days^β)."""
    lam = LAMBDA_BY_TYPE.get(task.defect_type, 0.04)
    a = age_days(task)
    # Scale age so λ stays in a sensible numeric range for demo ages 1–90
    return float(1.0 - math.exp(-lam * (a**beta) / 50.0))


def consequence(
    task: MaintenanceTask,
    section: Section,
    gmt_min: float,
    gmt_max: float,
    weights: tuple[float, float, float, float] = DEFAULT_WEIGHTS,
) -> float:
    """Weighted operational consequence of failure on this section."""
    w1, w2, w3, w4 = weights
    span = max(gmt_max - gmt_min, 1e-6)
    traffic_norm = (section.traffic_density_gmt - gmt_min) / span
    red = max(section.redundancy_factor, 1)
    return float(
        w1 * traffic_norm
        + w2 * section.passenger_criticality
        + w3 * (1.0 / red)
        + w4 * task.existing_TSR_flag
    )


def human_multiplier(score: float) -> float:
    """Map inspector score [1,5] → roughly [0.5, 1.5]."""
    return 0.5 + (np.clip(score, 1.0, 5.0) - 1.0) / 4.0


def statutory_deadline_urgency(
    task: MaintenanceTask,
    slot_minutes: int = 30,
    scale: float = STATUTORY_URGENCY_SCALE,
) -> float:
    """Spike as CRS/statutory deadline approaches; 0 if no statutory deadline."""
    if task.statutory_deadline_slot is None:
        return 0.0
    days_remaining = (task.statutory_deadline_slot * slot_minutes) / (60.0 * 24.0)
    lead = max(task.statutory_lead_time_days, 1.0)
    return float(max(0.0, 1.0 - days_remaining / lead) * scale)


def score_task_layer_a(
    task: MaintenanceTask,
    section: Section,
    gmt_min: float,
    gmt_max: float,
    weights: tuple[float, float, float, float] = DEFAULT_WEIGHTS,
    beta: float = DEFAULT_BETA,
    slot_minutes: int = 30,
) -> MaintenanceTask:
    pf = p_failure(task, beta=beta)
    cons = consequence(task, section, gmt_min, gmt_max, weights=weights)
    risk = pf * cons
    priority = risk * human_multiplier(task.human_criticality_score) + statutory_deadline_urgency(
        task, slot_minutes=slot_minutes
    )
    # Scale to a friendlier magnitude for the scheduler objective
    priority *= 100.0
    task.p_failure = pf
    task.consequence = cons
    task.risk_score = risk
    task.priority = float(priority)
    return task


def score_all_layer_a(
    tasks: Sequence[MaintenanceTask],
    sections: Sequence[Section],
    weights: tuple[float, float, float, float] = DEFAULT_WEIGHTS,
    beta: float = DEFAULT_BETA,
    slot_minutes: int = 30,
) -> list[MaintenanceTask]:
    by_id = {s.section_id: s for s in sections}
    gmts = [s.traffic_density_gmt for s in sections]
    gmt_min, gmt_max = min(gmts), max(gmts)
    scored = []
    for t in tasks:
        scored.append(
            score_task_layer_a(
                t, by_id[t.section_id], gmt_min, gmt_max, weights, beta, slot_minutes
            )
        )
    return scored


# ---------------------------------------------------------------------------
# Layer B — learned model (synthetic bootstrap; swappable estimator)
# ---------------------------------------------------------------------------

FEATURE_COLS = [
    "age_days",
    "traffic_density_gmt",
    "redundancy_factor",
    "existing_TSR_flag",
    "human_criticality_score",
    "defect_type",
    "repeat_defect_count_90d",
    "season",
]


def default_model_factory() -> HistGradientBoostingRegressor:
    """Swap this to xgboost.XGBRegressor on machines where xgboost is installed."""
    return HistGradientBoostingRegressor(
        max_depth=4,
        learning_rate=0.08,
        max_iter=120,
        random_state=42,
    )


class LayerBScorer:
    """Train/evaluate/rank pipeline. Model class is a single swappable factory."""

    def __init__(
        self,
        model_factory: Callable = default_model_factory,
        blend_alpha: float = 1.0,
    ):
        """
        blend_alpha: final = α·rule + (1-α)·learned.
        Start at 1.0 (rules only); decrease as trust in learned model grows.
        """
        self.model_factory = model_factory
        self.blend_alpha = blend_alpha
        self.model = None
        self._defect_enc = LabelEncoder()
        self._season_enc = LabelEncoder()
        self.metrics: dict = {}

    def _build_matrix(
        self,
        tasks: Sequence[MaintenanceTask],
        sections: Sequence[Section],
        fit_encoders: bool = False,
    ) -> np.ndarray:
        by_id = {s.section_id: s for s in sections}
        ages = np.array([age_days(t) for t in tasks], dtype=float)
        gmts = np.array([by_id[t.section_id].traffic_density_gmt for t in tasks])
        reds = np.array([by_id[t.section_id].redundancy_factor for t in tasks], dtype=float)
        tsrs = np.array([t.existing_TSR_flag for t in tasks], dtype=float)
        humans = np.array([t.human_criticality_score for t in tasks], dtype=float)
        repeats = np.array([t.repeat_defect_count_90d for t in tasks], dtype=float)
        defects = [t.defect_type for t in tasks]
        seasons = [t.season for t in tasks]
        if fit_encoders:
            d_enc = self._defect_enc.fit_transform(defects)
            s_enc = self._season_enc.fit_transform(seasons)
        else:
            # Unseen labels → map to 0
            d_known = set(self._defect_enc.classes_)
            s_known = set(self._season_enc.classes_)
            d_enc = np.array(
                [
                    self._defect_enc.transform([d])[0] if d in d_known else 0
                    for d in defects
                ]
            )
            s_enc = np.array(
                [
                    self._season_enc.transform([s])[0] if s in s_known else 0
                    for s in seasons
                ]
            )
        return np.column_stack([ages, gmts, reds, tsrs, humans, d_enc, repeats, s_enc])

    def train(
        self,
        tasks: Sequence[MaintenanceTask],
        sections: Sequence[Section],
        target: str = "days_to_failure",
    ) -> dict:
        X = self._build_matrix(tasks, sections, fit_encoders=True)
        if target == "days_to_failure":
            y = np.array(
                [t.days_to_failure if t.days_to_failure is not None else 60.0 for t in tasks]
            )
        else:
            y = np.array([t.did_fail_before_fixed for t in tasks], dtype=float)

        if len(tasks) < 8:
            self.model = self.model_factory()
            self.model.fit(X, y)
            self.metrics = {"n": len(tasks), "mae": float("nan"), "r2": float("nan")}
            return self.metrics

        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=42)
        self.model = self.model_factory()
        self.model.fit(Xtr, ytr)
        pred = self.model.predict(Xte)
        mae = float(np.mean(np.abs(pred - yte)))
        ss_res = float(np.sum((yte - pred) ** 2))
        ss_tot = float(np.sum((yte - np.mean(yte)) ** 2)) + 1e-9
        r2 = 1.0 - ss_res / ss_tot
        self.metrics = {"n": len(tasks), "mae": mae, "r2": r2, "target": target}
        return self.metrics

    def predict_urgency(
        self, tasks: Sequence[MaintenanceTask], sections: Sequence[Section]
    ) -> np.ndarray:
        """Higher = more urgent. Invert predicted days_to_failure."""
        if self.model is None:
            raise RuntimeError("LayerBScorer.train() must be called first")
        X = self._build_matrix(tasks, sections, fit_encoders=False)
        pred_days = self.model.predict(X)
        # Convert to urgency in ~[0,1]
        return 1.0 / (1.0 + np.maximum(pred_days, 0.1) / 30.0)

    def blend_priorities(
        self,
        tasks: Sequence[MaintenanceTask],
        sections: Sequence[Section],
    ) -> list[MaintenanceTask]:
        """final_score = α·rule_score + (1-α)·learned_score (scaled)."""
        if self.blend_alpha >= 1.0 - 1e-9 or self.model is None:
            return list(tasks)
        learned = self.predict_urgency(tasks, sections)
        # Scale learned to roughly match rule priority magnitude
        rule = np.array([t.priority for t in tasks])
        scale = (np.mean(rule) + 1e-6) / (np.mean(learned) + 1e-6)
        learned_scaled = learned * scale
        for t, lr in zip(tasks, learned_scaled):
            t.priority = float(
                self.blend_alpha * t.priority + (1.0 - self.blend_alpha) * lr
            )
        return list(tasks)


# ---------------------------------------------------------------------------
# Bundling — spatial-temporal clustering (deterministic)
# ---------------------------------------------------------------------------

def _possessions_compatible(a: PossessionType, b: PossessionType) -> bool:
    return b in POSSESSION_COMPAT.get(a, {a})


def _cluster_section_tasks(
    tasks: list[MaintenanceTask],
    max_gap_km: float,
) -> list[list[MaintenanceTask]]:
    """
    Interval-merge style clustering on 1-D chainage within one section.

    Tasks join a cluster if chainage gap ≤ max_gap_km AND either:
      - possession types are compatible, OR
      - the task is from a different department (cross-dept bundling is the goal —
        the shared block becomes COMBINED possession).
    """
    if not tasks:
        return []
    ordered = sorted(tasks, key=lambda t: t.chainage_km)
    clusters: list[list[MaintenanceTask]] = [[ordered[0]]]
    cluster_types: list[set[PossessionType]] = [{ordered[0].possession_type}]
    cluster_depts: list[set] = [{ordered[0].department}]

    for task in ordered[1:]:
        placed = False
        for i, cluster in enumerate(clusters):
            c_min = min(t.chainage_km for t in cluster)
            c_max = max(t.chainage_km for t in cluster)
            if c_min <= task.chainage_km <= c_max:
                gap = 0.0
            else:
                gap = max(0.0, task.chainage_km - c_max, c_min - task.chainage_km)

            poss_ok = any(
                _possessions_compatible(task.possession_type, pt) for pt in cluster_types[i]
            )
            cross_dept = task.department not in cluster_depts[i]
            if gap <= max_gap_km and (poss_ok or cross_dept):
                cluster.append(task)
                cluster_types[i].add(task.possession_type)
                cluster_depts[i].add(task.department)
                placed = True
                break
        if not placed:
            clusters.append([task])
            cluster_types.append({task.possession_type})
            cluster_depts.append({task.department})
    return clusters


def bundle_tasks(
    tasks: Sequence[MaintenanceTask],
    slot_minutes: int = 30,
    max_gap_km: float = DEFAULT_GAP_KM,
    bundling_bonus: float = BUNDLING_BONUS,
) -> list[SuperTask]:
    """
    Group nearby compatible tasks into super-tasks for the scheduler.

    cluster_duration = max(member durations)
    cluster_priority = max(member priorities) + bonus × (n_departments - 1)
    """
    by_section: dict[str, list[MaintenanceTask]] = defaultdict(list)
    for t in tasks:
        by_section[t.section_id].append(t)

    super_tasks: list[SuperTask] = []
    cid = 0
    for section_id, section_tasks in by_section.items():
        for cluster in _cluster_section_tasks(section_tasks, max_gap_km):
            cid += 1
            durations = [t.duration_min for t in cluster]
            max_dur = max(durations)
            duration_slots = int(math.ceil(max_dur / slot_minutes))
            depts = sorted({t.department.value for t in cluster})
            n_dept = len(depts)
            priorities = [t.priority for t in cluster]
            cluster_priority = max(priorities) + bundling_bonus * (n_dept - 1)

            # Hard deadline = earliest statutory among members (if any)
            statutory = [
                t.statutory_deadline_slot
                for t in cluster
                if t.statutory_deadline_slot is not None
            ]
            deadline = min(statutory) if statutory else None

            soft = [
                t.soft_deadline_slot for t in cluster if t.soft_deadline_slot is not None
            ]
            soft_deadline = min(soft) if soft else None

            earliest = max(t.earliest_start_slot for t in cluster)
            chainages = [t.chainage_km for t in cluster]

            # Combined possession if multiple departments
            if n_dept > 1:
                poss = PossessionType.COMBINED
            else:
                poss = cluster[0].possession_type

            super_tasks.append(
                SuperTask(
                    cluster_id=f"C-{cid:03d}",
                    section_id=section_id,
                    chainage_start=min(chainages),
                    chainage_end=max(chainages),
                    duration_slots=duration_slots,
                    duration_min=max_dur,
                    priority=float(cluster_priority),
                    earliest_start=earliest,
                    deadline=deadline,
                    soft_deadline=soft_deadline,
                    member_task_ids=[t.task_id for t in cluster],
                    departments=depts,
                    possession_type=poss,
                )
            )
    # Highest priority first (stable for demos)
    super_tasks.sort(key=lambda c: (-c.priority, c.cluster_id))
    return super_tasks


def run_criticality_pipeline(
    tasks: Sequence[MaintenanceTask],
    sections: Sequence[Section],
    slot_minutes: int = 30,
    blend_alpha: float = 1.0,
    train_layer_b: bool = True,
) -> tuple[list[MaintenanceTask], list[SuperTask], Optional[LayerBScorer]]:
    """Score → optional Layer B blend → bundle. Returns (tasks, clusters, scorer)."""
    scored = score_all_layer_a(list(tasks), sections, slot_minutes=slot_minutes)
    scorer = None
    if train_layer_b:
        scorer = LayerBScorer(blend_alpha=blend_alpha)
        scorer.train(scored, sections)
        if blend_alpha < 1.0:
            scored = scorer.blend_priorities(scored, sections)
    clusters = bundle_tasks(scored, slot_minutes=slot_minutes)
    return scored, clusters, scorer


if __name__ == "__main__":
    from block_planner.data_gen import generate_scenario

    sc = generate_scenario(seed=7, n_per_dept=10)
    scored, clusters, scorer = run_criticality_pipeline(sc["tasks"], sc["sections"])
    print(f"Scored {len(scored)} tasks → {len(clusters)} super-tasks")
    if scorer:
        print(f"Layer B metrics: {scorer.metrics}")
    for c in clusters[:5]:
        print(
            f"  {c.cluster_id} sec={c.section_id} "
            f"pri={c.priority:.1f} dur={c.duration_slots}sl "
            f"depts={c.departments} members={len(c.member_task_ids)}"
        )
