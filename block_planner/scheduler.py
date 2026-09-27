"""Component B — Block scheduler (CP-SAT primary, scipy MILP fallback)."""

from __future__ import annotations

import math
from typing import Literal, Optional, Sequence

import numpy as np

from block_planner.models import ScheduleResult, ScheduledBlock, Section, SuperTask

Backend = Literal["cpsat", "milp", "auto"]

BUFFER_FRACTION = 0.15
BUFFER_MIN_MINUTES = 10
TARDINESS_PENALTY = 5.0
PRIORITY_SCALE = 1000  # CP-SAT wants ints


def _buffer_slots(duration_slots: int, slot_minutes: int) -> int:
    buf_min = max(BUFFER_MIN_MINUTES, int(math.ceil(duration_slots * slot_minutes * BUFFER_FRACTION)))
    return max(1, int(math.ceil(buf_min / slot_minutes)))


def _feasible_starts(
    cluster: SuperTask,
    availability: np.ndarray,
    horizon: int,
) -> list[int]:
    """Slots where the full duration fits inside available windows."""
    dur = cluster.duration_slots
    starts = []
    earliest = max(0, cluster.earliest_start)
    latest = horizon - dur
    if cluster.deadline is not None:
        latest = min(latest, cluster.deadline - dur)
    if latest < earliest:
        return []
    for t in range(earliest, latest + 1):
        window = availability[t : t + dur]
        if len(window) == dur and np.all(window == 1):
            starts.append(t)
    return starts


def _ortools_available() -> bool:
    try:
        from ortools.sat.python import cp_model  # noqa: F401

        return True
    except ImportError:
        return False


# ---------------------------------------------------------------------------
# CP-SAT backend
# ---------------------------------------------------------------------------

def _solve_cpsat(
    clusters: Sequence[SuperTask],
    availability: dict[str, np.ndarray],
    horizon_slots: int,
    slot_minutes: int,
    time_limit_s: float = 20.0,
    fixed: Optional[dict[str, int]] = None,
) -> ScheduleResult:
    from ortools.sat.python import cp_model

    fixed = fixed or {}
    model = cp_model.CpModel()

    # Precompute feasible starts; drop impossible non-statutory clusters
    feasible: dict[str, list[int]] = {}
    active: list[SuperTask] = []
    forced_unscheduled: list[str] = []

    for c in clusters:
        avail = availability[c.section_id]
        starts = _feasible_starts(c, avail, horizon_slots)
        if c.cluster_id in fixed:
            fs = fixed[c.cluster_id]
            if fs in starts or (
                0 <= fs <= horizon_slots - c.duration_slots
                and np.all(avail[fs : fs + c.duration_slots] == 1)
            ):
                starts = [fs]
            else:
                # Fixed start no longer feasible — keep as soft later via greedy
                starts = [fs] if 0 <= fs <= horizon_slots - c.duration_slots else []
        if not starts:
            if c.deadline is not None:
                # Statutory but no room — mark unscheduled (infeasible hard constraint)
                forced_unscheduled.append(c.cluster_id)
            else:
                forced_unscheduled.append(c.cluster_id)
            continue
        feasible[c.cluster_id] = starts
        active.append(c)

    start_vars: dict[str, cp_model.IntVar] = {}
    sched_vars: dict[str, cp_model.IntVar] = {}
    intervals_by_section: dict[str, list] = {}
    tardiness_vars: list = []

    for c in active:
        starts = feasible[c.cluster_id]
        # Map start choice via optional interval + presence
        sched = model.NewBoolVar(f"sched_{c.cluster_id}")
        # start takes values from the feasible set via element-style domain
        start = model.NewIntVarFromDomain(
            cp_model.Domain.FromValues(starts), f"start_{c.cluster_id}"
        )
        end = model.NewIntVar(0, horizon_slots, f"end_{c.cluster_id}")
        model.Add(end == start + c.duration_slots)

        if c.deadline is not None:
            # Hard: must schedule and finish by deadline
            model.Add(sched == 1)
            model.Add(end <= c.deadline)
        elif c.cluster_id in fixed:
            model.Add(sched == 1)
            model.Add(start == fixed[c.cluster_id])

        interval = model.NewOptionalIntervalVar(
            start, c.duration_slots, end, sched, f"iv_{c.cluster_id}"
        )
        intervals_by_section.setdefault(c.section_id, []).append(interval)
        start_vars[c.cluster_id] = start
        sched_vars[c.cluster_id] = sched

        # Soft tardiness vs soft_deadline
        if c.soft_deadline is not None:
            tard = model.NewIntVar(0, horizon_slots, f"tard_{c.cluster_id}")
            # tardiness = max(0, end - soft_deadline) * sched
            # end - soft_deadline <= tard; tard >= 0; if not scheduled tard = 0
            model.Add(tard >= end - c.soft_deadline).OnlyEnforceIf(sched)
            model.Add(tard == 0).OnlyEnforceIf(sched.Not())
            tardiness_vars.append((tard, c.priority))

    for section_id, ivs in intervals_by_section.items():
        if len(ivs) > 1:
            model.AddNoOverlap(ivs)
        elif len(ivs) == 1:
            pass

    # Objective: max Σ priority·scheduled − penalty·Σ tardiness
    obj_terms = []
    for c in active:
        p_int = int(round(c.priority * PRIORITY_SCALE))
        obj_terms.append(p_int * sched_vars[c.cluster_id])
    for tard, pri in tardiness_vars:
        pen = int(round(TARDINESS_PENALTY * max(pri, 1.0)))
        obj_terms.append(-pen * tard)

    model.Maximize(sum(obj_terms) if obj_terms else 0)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_s
    solver.parameters.num_search_workers = 4
    status = solver.Solve(model)

    blocks: list[ScheduledBlock] = []
    unscheduled = list(forced_unscheduled)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for c in active:
            if solver.Value(sched_vars[c.cluster_id]) == 1:
                s = solver.Value(start_vars[c.cluster_id])
                buf = _buffer_slots(c.duration_slots, slot_minutes)
                blocks.append(
                    ScheduledBlock(
                        cluster_id=c.cluster_id,
                        section_id=c.section_id,
                        start_slot=s,
                        end_slot=s + c.duration_slots,
                        priority=c.priority,
                        duration_slots=c.duration_slots,
                        buffer_slots=buf,
                        scheduled=True,
                    )
                )
            else:
                unscheduled.append(c.cluster_id)
        objective = solver.ObjectiveValue()
    else:
        unscheduled.extend(c.cluster_id for c in active)
        objective = 0.0

    blocks.sort(key=lambda b: (b.section_id, b.start_slot))
    return ScheduleResult(
        blocks=blocks,
        unscheduled=unscheduled,
        horizon_slots=horizon_slots,
        slot_minutes=slot_minutes,
        backend="cpsat",
        objective=float(objective),
    )


# ---------------------------------------------------------------------------
# MILP fallback (scipy.optimize.milp) — identical constraint set, big-M
# ---------------------------------------------------------------------------

def _solve_milp(
    clusters: Sequence[SuperTask],
    availability: dict[str, np.ndarray],
    horizon_slots: int,
    slot_minutes: int,
    time_limit_s: float = 20.0,
    fixed: Optional[dict[str, int]] = None,
) -> ScheduleResult:
    from scipy.optimize import LinearConstraint, Bounds, milp

    fixed = fixed or {}
    # Limit problem size for scipy (demo-scale)
    feasible: dict[str, list[int]] = {}
    active: list[SuperTask] = []
    forced_unscheduled: list[str] = []

    for c in clusters:
        starts = _feasible_starts(c, availability[c.section_id], horizon_slots)
        if c.cluster_id in fixed:
            fs = fixed[c.cluster_id]
            if fs in starts:
                starts = [fs]
            elif 0 <= fs <= horizon_slots - c.duration_slots:
                starts = [fs]
            else:
                starts = []
        if not starts:
            forced_unscheduled.append(c.cluster_id)
            continue
        # Cap start candidates to keep MILP tractable
        if len(starts) > 40:
            # Prefer evenly spaced + earliest + deadline-near
            idx = np.linspace(0, len(starts) - 1, 40).astype(int)
            starts = sorted({starts[i] for i in idx})
        feasible[c.cluster_id] = starts
        active.append(c)

    if not active:
        return ScheduleResult(
            blocks=[],
            unscheduled=forced_unscheduled,
            horizon_slots=horizon_slots,
            slot_minutes=slot_minutes,
            backend="milp",
            objective=0.0,
        )

    # Variables layout:
    # for each cluster i: x_{i,k} for each feasible start k, then s_i binary (=sum x)
    # Actually: x_{i,k} binary = start at starts[k]; scheduled_i = sum_k x_{i,k} ≤ 1
    var_index: dict[tuple[str, int], int] = {}
    n = 0
    for c in active:
        for s in feasible[c.cluster_id]:
            var_index[(c.cluster_id, s)] = n
            n += 1

    # Objective: maximize → milp minimizes, so negate
    c_obj = np.zeros(n)
    for c in active:
        for s in feasible[c.cluster_id]:
            j = var_index[(c.cluster_id, s)]
            c_obj[j] = -c.priority
            # Soft tardiness penalty
            if c.soft_deadline is not None:
                end = s + c.duration_slots
                tard = max(0, end - c.soft_deadline)
                c_obj[j] += TARDINESS_PENALTY * tard * max(c.priority, 1.0) / 10.0

    # Constraints list as rows
    A_rows = []
    lb = []
    ub = []

    # At most one start per cluster; statutory → exactly one
    for c in active:
        row = np.zeros(n)
        for s in feasible[c.cluster_id]:
            row[var_index[(c.cluster_id, s)]] = 1.0
        A_rows.append(row)
        if c.deadline is not None or c.cluster_id in fixed:
            lb.append(1.0)
            ub.append(1.0)
        else:
            lb.append(0.0)
            ub.append(1.0)

    # No-overlap per section: for every pair of clusters on same section,
    # and every pair of starts that overlap, x_a + x_b ≤ 1
    by_sec: dict[str, list[SuperTask]] = {}
    for c in active:
        by_sec.setdefault(c.section_id, []).append(c)

    for sec, group in by_sec.items():
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                a, b = group[i], group[j]
                for sa in feasible[a.cluster_id]:
                    ea = sa + a.duration_slots
                    for sb in feasible[b.cluster_id]:
                        eb = sb + b.duration_slots
                        if sa < eb and sb < ea:  # overlap
                            row = np.zeros(n)
                            row[var_index[(a.cluster_id, sa)]] = 1.0
                            row[var_index[(b.cluster_id, sb)]] = 1.0
                            A_rows.append(row)
                            lb.append(0.0)
                            ub.append(1.0)

    if A_rows:
        A = np.vstack(A_rows)
        constraints = LinearConstraint(A, np.array(lb), np.array(ub))
    else:
        constraints = None

    integrality = np.ones(n)
    bounds = Bounds(0, 1)

    result = milp(
        c=c_obj,
        integrality=integrality,
        bounds=bounds,
        constraints=constraints,
        options={"time_limit": time_limit_s, "disp": False},
    )

    blocks: list[ScheduledBlock] = []
    unscheduled = list(forced_unscheduled)

    if result.success and result.x is not None:
        x = result.x
        chosen: dict[str, int] = {}
        for c in active:
            best_s, best_val = None, 0.5
            for s in feasible[c.cluster_id]:
                val = x[var_index[(c.cluster_id, s)]]
                if val > best_val:
                    best_val = val
                    best_s = s
            if best_s is not None:
                chosen[c.cluster_id] = best_s
            else:
                unscheduled.append(c.cluster_id)

        for c in active:
            if c.cluster_id not in chosen:
                continue
            s = chosen[c.cluster_id]
            buf = _buffer_slots(c.duration_slots, slot_minutes)
            blocks.append(
                ScheduledBlock(
                    cluster_id=c.cluster_id,
                    section_id=c.section_id,
                    start_slot=s,
                    end_slot=s + c.duration_slots,
                    priority=c.priority,
                    duration_slots=c.duration_slots,
                    buffer_slots=buf,
                    scheduled=True,
                )
            )
        objective = float(-result.fun) if result.fun is not None else 0.0
    else:
        # Greedy fallback if MILP fails
        return _greedy_pack(
            active, availability, horizon_slots, slot_minutes, forced_unscheduled, fixed
        )

    blocks.sort(key=lambda b: (b.section_id, b.start_slot))
    return ScheduleResult(
        blocks=blocks,
        unscheduled=unscheduled,
        horizon_slots=horizon_slots,
        slot_minutes=slot_minutes,
        backend="milp",
        objective=objective,
    )


def _greedy_pack(
    clusters: Sequence[SuperTask],
    availability: dict[str, np.ndarray],
    horizon_slots: int,
    slot_minutes: int,
    already_unscheduled: list[str],
    fixed: Optional[dict[str, int]] = None,
) -> ScheduleResult:
    """Priority-descending pack into first feasible gap (MILP failure fallback)."""
    fixed = fixed or {}
    occupied: dict[str, np.ndarray] = {
        sid: (1 - avail.copy()) for sid, avail in availability.items()
    }
    blocks = []
    unscheduled = list(already_unscheduled)
    ordered = sorted(clusters, key=lambda c: -c.priority)

    for c in ordered:
        if c.cluster_id in fixed:
            s = fixed[c.cluster_id]
            if np.all(occupied[c.section_id][s : s + c.duration_slots] == 0):
                occupied[c.section_id][s : s + c.duration_slots] = 1
                buf = _buffer_slots(c.duration_slots, slot_minutes)
                blocks.append(
                    ScheduledBlock(
                        cluster_id=c.cluster_id,
                        section_id=c.section_id,
                        start_slot=s,
                        end_slot=s + c.duration_slots,
                        priority=c.priority,
                        duration_slots=c.duration_slots,
                        buffer_slots=buf,
                    )
                )
            else:
                unscheduled.append(c.cluster_id)
            continue

        starts = _feasible_starts(c, 1 - occupied[c.section_id], horizon_slots)
        # Re-check against original availability AND current occupation
        placed = False
        for s in starts:
            if np.all(occupied[c.section_id][s : s + c.duration_slots] == 0) and np.all(
                availability[c.section_id][s : s + c.duration_slots] == 1
            ):
                occupied[c.section_id][s : s + c.duration_slots] = 1
                buf = _buffer_slots(c.duration_slots, slot_minutes)
                blocks.append(
                    ScheduledBlock(
                        cluster_id=c.cluster_id,
                        section_id=c.section_id,
                        start_slot=s,
                        end_slot=s + c.duration_slots,
                        priority=c.priority,
                        duration_slots=c.duration_slots,
                        buffer_slots=buf,
                    )
                )
                placed = True
                break
        if not placed:
            unscheduled.append(c.cluster_id)

    blocks.sort(key=lambda b: (b.section_id, b.start_slot))
    return ScheduleResult(
        blocks=blocks,
        unscheduled=unscheduled,
        horizon_slots=horizon_slots,
        slot_minutes=slot_minutes,
        backend="greedy",
        objective=sum(b.priority for b in blocks),
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def solve_schedule(
    clusters: Sequence[SuperTask],
    sections: Sequence[Section],
    availability: dict[str, np.ndarray],
    horizon_slots: Optional[int] = None,
    slot_minutes: int = 30,
    backend: Backend = "auto",
    time_limit_s: float = 20.0,
    fixed: Optional[dict[str, int]] = None,
) -> ScheduleResult:
    """
    Schedule super-tasks into available corridor slots.

    backend: "cpsat" | "milp" | "auto" (prefer CP-SAT if ortools is installed)
    fixed: optional {cluster_id: start_slot} hard-locked placements (rolling horizon)
    """
    if horizon_slots is None:
        horizon_slots = next(iter(availability.values())).shape[0]

    if backend == "auto":
        backend = "cpsat" if _ortools_available() else "milp"

    if backend == "cpsat":
        if not _ortools_available():
            backend = "milp"
        else:
            return _solve_cpsat(
                clusters, availability, horizon_slots, slot_minutes, time_limit_s, fixed
            )

    return _solve_milp(
        clusters, availability, horizon_slots, slot_minutes, time_limit_s, fixed
    )


def solve_weekly(
    clusters: Sequence[SuperTask],
    sections: Sequence[Section],
    availability: dict[str, np.ndarray],
    slot_minutes: int = 30,
    backend: Backend = "auto",
) -> ScheduleResult:
    """Fine-grained weekly operational plan."""
    return solve_schedule(
        clusters, sections, availability, slot_minutes=slot_minutes, backend=backend
    )


def solve_monthly_rolling(
    clusters: Sequence[SuperTask],
    sections: Sequence[Section],
    weekly_availability: dict[str, np.ndarray],
    week1_result: ScheduleResult,
    n_weeks: int = 4,
    slots_per_week: Optional[int] = None,
    slot_minutes: int = 30,
    backend: Backend = "auto",
) -> list[ScheduleResult]:
    """
    Rolling monthly: fix week-1 decisions, optimize weeks 2–4 loosely.
    For the demo we replicate/extend the weekly availability grid and
    re-solve remaining clusters with week-1 locked.
    """
    slots_per_week = slots_per_week or week1_result.horizon_slots
    scheduled_ids = {b.cluster_id for b in week1_result.blocks}
    remaining = [c for c in clusters if c.cluster_id not in scheduled_ids]

    results = [week1_result]
    fixed = {b.cluster_id: b.start_slot for b in week1_result.blocks}

    # Build a multi-week availability by tiling (synthetic stand-in for COA month)
    monthly_avail = {
        sid: np.tile(grid, n_weeks) for sid, grid in weekly_availability.items()
    }
    # Shift remaining clusters' earliest_start into later weeks loosely
    shifted = []
    for i, c in enumerate(remaining):
        week = 1 + (i % (n_weeks - 1))
        new_c = SuperTask(
            cluster_id=c.cluster_id,
            section_id=c.section_id,
            chainage_start=c.chainage_start,
            chainage_end=c.chainage_end,
            duration_slots=c.duration_slots,
            duration_min=c.duration_min,
            priority=c.priority * 0.9,  # slightly softer in outer weeks
            earliest_start=max(c.earliest_start, week * slots_per_week),
            deadline=(c.deadline + week * slots_per_week) if c.deadline is not None else None,
            soft_deadline=(
                c.soft_deadline + week * slots_per_week if c.soft_deadline is not None else None
            ),
            member_task_ids=list(c.member_task_ids),
            departments=list(c.departments),
            possession_type=c.possession_type,
        )
        shifted.append(new_c)

    month_result = solve_schedule(
        shifted,
        sections,
        monthly_avail,
        horizon_slots=slots_per_week * n_weeks,
        slot_minutes=slot_minutes,
        backend=backend,
        time_limit_s=30.0,
        fixed=None,  # week1 already done; only schedule remaining
    )
    results.append(month_result)
    return results


def validate_no_overlap(result: ScheduleResult) -> bool:
    """Return True if no two blocks on the same section overlap."""
    by_sec: dict[str, list[ScheduledBlock]] = {}
    for b in result.blocks:
        by_sec.setdefault(b.section_id, []).append(b)
    for blocks in by_sec.values():
        ordered = sorted(blocks, key=lambda b: b.start_slot)
        for i in range(len(ordered) - 1):
            if ordered[i].end_slot > ordered[i + 1].start_slot:
                return False
    return True


if __name__ == "__main__":
    from block_planner.criticality import run_criticality_pipeline
    from block_planner.data_gen import generate_scenario

    sc = generate_scenario(seed=42, n_per_dept=8)
    _, clusters, _ = run_criticality_pipeline(sc["tasks"], sc["sections"])
    result = solve_weekly(clusters, sc["sections"], sc["availability"])
    print(f"Backend={result.backend} scheduled={len(result.blocks)} "
          f"unscheduled={len(result.unscheduled)} obj={result.objective:.1f}")
    print(f"No-overlap OK: {validate_no_overlap(result)}")
    for b in result.blocks[:8]:
        print(f"  {b.cluster_id} {b.section_id} "
              f"[{b.start_slot},{b.end_slot}) pri={b.priority:.1f} buf={b.buffer_slots}")
