"""Component D — Rescheduling engine (Tier 1 / 2 / 3)."""

from __future__ import annotations

import copy
from typing import Optional, Sequence

import numpy as np

from block_planner.models import (
    DelayEvent,
    RescheduleDiff,
    ScheduleResult,
    ScheduledBlock,
    SuperTask,
)
from block_planner.scheduler import (
    _buffer_slots,
    solve_schedule,
)

TIER2_WINDOW_HOURS = 5
TIER2_SHIFT_WEIGHT = 1.0
TIER2_DROP_PENALTY = 1e6


def _slot_of(minutes: float, slot_minutes: int) -> int:
    return int(minutes // slot_minutes)


def _block_occupies_slot(block: ScheduledBlock, slot: int) -> bool:
    return block.start_slot <= slot < block.end_slot


def _availability_with_delay(
    availability: dict[str, np.ndarray],
    event: DelayEvent,
    slot_minutes: int,
    occupy_extra_slots: int = 2,
) -> dict[str, np.ndarray]:
    """Mark delayed train's section slots as occupied (unavailable for blocks)."""
    new_avail = {sid: grid.copy() for sid, grid in availability.items()}
    if event.section_id not in new_avail:
        return new_avail
    start = _slot_of(event.planned_time, slot_minutes)
    # Train now occupies from planned through actual (+ margin)
    end = _slot_of(event.actual_time, slot_minutes) + occupy_extra_slots
    grid = new_avail[event.section_id]
    for t in range(max(0, start), min(len(grid), end + 1)):
        grid[t] = 0
    return new_avail


def tier1_absorb(
    block: ScheduledBlock,
    availability: np.ndarray,
) -> bool:
    """
    True if the block's core [start, end) is still fully available after the
    delay — i.e. the disruption only ate into contingency buffer / neighbouring
    corridor slack, so no recompute is needed.
    """
    if block.end_slot > len(availability) or block.start_slot < 0:
        return False
    return bool(np.all(availability[block.start_slot : block.end_slot] == 1))


def _delay_impact_range(
    event: DelayEvent, slot_minutes: int, horizon: int
) -> tuple[int, int]:
    start = max(0, _slot_of(event.planned_time, slot_minutes) - 1)
    end = min(horizon, _slot_of(event.actual_time, slot_minutes) + 3)
    return start, end


def _blocks_near_delay(
    schedule: ScheduleResult,
    event: DelayEvent,
    slot_minutes: int,
) -> list[ScheduledBlock]:
    """Blocks on the delayed section whose buffered window intersects the delay impact."""
    impact_lo, impact_hi = _delay_impact_range(
        event, slot_minutes, schedule.horizon_slots
    )
    near = []
    for b in schedule.blocks:
        if b.section_id != event.section_id:
            continue
        # Intersect [start, buffered_end) with impact
        if b.start_slot < impact_hi and b.buffered_end > impact_lo:
            near.append(b)
    return near


def _tier2_scoped_resolve(
    schedule: ScheduleResult,
    clusters_by_id: dict[str, SuperTask],
    availability: dict[str, np.ndarray],
    affected: list[ScheduledBlock],
    event: DelayEvent,
    slot_minutes: int,
    window_hours: float = TIER2_WINDOW_HOURS,
) -> tuple[list[ScheduledBlock], list[RescheduleDiff], bool]:
    """
    Re-solve only the affected section within the next window_hours.
    Everything outside the window stays fixed.
    Returns (new_section_blocks, diffs, success).
    """
    if not affected:
        return [], [], True

    section_id = event.section_id
    anchor = min(b.start_slot for b in affected)
    window_slots = int((window_hours * 60) / slot_minutes)
    win_start = max(0, anchor - 2)
    win_end = min(schedule.horizon_slots, anchor + window_slots)

    # Clusters to re-optimize: affected + any other block overlapping the window on section
    movable_ids = set()
    fixed_outside: dict[str, int] = {}
    for b in schedule.blocks:
        if b.section_id != section_id:
            continue
        overlaps_window = b.start_slot < win_end and b.end_slot > win_start
        if overlaps_window or b.cluster_id in {a.cluster_id for a in affected}:
            movable_ids.add(b.cluster_id)
        else:
            fixed_outside[b.cluster_id] = b.start_slot

    movable = [clusters_by_id[cid] for cid in movable_ids if cid in clusters_by_id]
    if not movable:
        return [], [], False

    # Restrict earliest/deadline into window for the mini-solve
    scoped = []
    for c in movable:
        sc = SuperTask(
            cluster_id=c.cluster_id,
            section_id=c.section_id,
            chainage_start=c.chainage_start,
            chainage_end=c.chainage_end,
            duration_slots=c.duration_slots,
            duration_min=c.duration_min,
            priority=c.priority,
            earliest_start=max(c.earliest_start, win_start),
            deadline=min(c.deadline, win_end) if c.deadline is not None else win_end,
            soft_deadline=c.soft_deadline,
            member_task_ids=list(c.member_task_ids),
            departments=list(c.departments),
            possession_type=c.possession_type,
        )
        # Ensure deadline >= earliest + duration when possible
        if sc.deadline is not None and sc.deadline < sc.earliest_start + sc.duration_slots:
            sc.deadline = win_end
        scoped.append(sc)

    # Slice availability conceptually via earliest/deadline; full grid still passed
    try:
        result = solve_schedule(
            scoped,
            sections=[],  # unused by solver
            availability=availability,
            horizon_slots=schedule.horizon_slots,
            slot_minutes=slot_minutes,
            backend="auto",
            time_limit_s=8.0,
        )
    except Exception:
        return [], [], False

    old_by_id = {b.cluster_id: b for b in schedule.blocks if b.section_id == section_id}
    diffs: list[RescheduleDiff] = []
    new_blocks: list[ScheduledBlock] = []

    scheduled_ids = {b.cluster_id for b in result.blocks}
    reason = (
        f"train {event.train_id} delayed {event.delay_minutes:.0f} min "
        f"on {event.section_id}"
    )

    # Prefer solutions that minimize priority-weighted shift
    for b in result.blocks:
        old = old_by_id.get(b.cluster_id)
        new_blocks.append(b)
        if old and (old.start_slot != b.start_slot or old.end_slot != b.end_slot):
            diffs.append(
                RescheduleDiff(
                    task_id=b.cluster_id,
                    old_window=(old.start_slot, old.end_slot),
                    new_window=(b.start_slot, b.end_slot),
                    reason=reason,
                    tier_used=2,
                )
            )

    for cid in movable_ids:
        if cid not in scheduled_ids and cid in old_by_id:
            old = old_by_id[cid]
            diffs.append(
                RescheduleDiff(
                    task_id=cid,
                    old_window=(old.start_slot, old.end_slot),
                    new_window=None,
                    reason=reason + " (dropped in scoped re-solve)",
                    tier_used=2,
                )
            )

    # Success if we didn't drop more than we could avoid — accept any feasible solve
    return new_blocks, diffs, True


def _tier3_greedy(
    schedule: ScheduleResult,
    availability: dict[str, np.ndarray],
    affected: list[ScheduledBlock],
    event: DelayEvent,
    slot_minutes: int,
) -> tuple[list[ScheduledBlock], list[RescheduleDiff]]:
    """
    Sort conflicting blocks by priority desc; keep highest; push rest into
    next feasible gap, largest-duration-first.
    """
    section_id = event.section_id
    reason = (
        f"train {event.train_id} delayed {event.delay_minutes:.0f} min "
        f"on {event.section_id}"
    )
    grid = availability[section_id].copy()

    # Freeze non-affected blocks on this section into the occupation grid
    affected_ids = {b.cluster_id for b in affected}
    section_blocks = [b for b in schedule.blocks if b.section_id == section_id]
    for b in section_blocks:
        if b.cluster_id not in affected_ids:
            grid[b.start_slot : b.end_slot] = 0

    keep_order = sorted(affected, key=lambda b: -b.priority)
    diffs: list[RescheduleDiff] = []
    new_blocks: list[ScheduledBlock] = []

    if keep_order:
        # Try to keep the highest-priority in place if still feasible, else shift it first
        primary = keep_order[0]
        rest = keep_order[1:]
        # Largest-duration-first among the rest
        rest = sorted(rest, key=lambda b: -b.duration_slots)

        candidates = [primary] + rest
    else:
        candidates = []

    for b in candidates:
        # Prefer original start if free
        placed = False
        if np.all(grid[b.start_slot : b.end_slot] == 1):
            grid[b.start_slot : b.end_slot] = 0
            new_blocks.append(b)
            placed = True
        else:
            # Search forward for next feasible gap
            for s in range(b.start_slot, schedule.horizon_slots - b.duration_slots + 1):
                if np.all(grid[s : s + b.duration_slots] == 1):
                    buf = _buffer_slots(b.duration_slots, slot_minutes)
                    nb = ScheduledBlock(
                        cluster_id=b.cluster_id,
                        section_id=b.section_id,
                        start_slot=s,
                        end_slot=s + b.duration_slots,
                        priority=b.priority,
                        duration_slots=b.duration_slots,
                        buffer_slots=buf,
                    )
                    grid[s : s + b.duration_slots] = 0
                    new_blocks.append(nb)
                    diffs.append(
                        RescheduleDiff(
                            task_id=b.cluster_id,
                            old_window=(b.start_slot, b.end_slot),
                            new_window=(nb.start_slot, nb.end_slot),
                            reason=reason,
                            tier_used=3,
                        )
                    )
                    placed = True
                    break
        if not placed:
            diffs.append(
                RescheduleDiff(
                    task_id=b.cluster_id,
                    old_window=(b.start_slot, b.end_slot),
                    new_window=None,
                    reason=reason + " (no feasible gap)",
                    tier_used=3,
                )
            )
        elif b.cluster_id == (keep_order[0].cluster_id if keep_order else None):
            # If primary kept in place, no diff needed unless it moved (handled above)
            if placed and new_blocks and new_blocks[-1].start_slot == b.start_slot:
                pass

    return new_blocks, diffs


def apply_reschedule(
    schedule: ScheduleResult,
    diffs: list[RescheduleDiff],
    section_id: str,
    replacement_blocks: list[ScheduledBlock],
) -> ScheduleResult:
    """Merge replacement blocks for a section into a new ScheduleResult."""
    new_schedule = copy.deepcopy(schedule)
    drop_ids = {d.task_id for d in diffs if d.new_window is None}
    replace_ids = {b.cluster_id for b in replacement_blocks}

    kept = [
        b
        for b in new_schedule.blocks
        if not (b.section_id == section_id and (b.cluster_id in replace_ids or b.cluster_id in drop_ids))
    ]
    # Also remove affected that were replaced
    kept = [b for b in kept if b.cluster_id not in replace_ids]
    kept.extend(replacement_blocks)
    # Deduplicate by cluster_id
    by_id = {b.cluster_id: b for b in kept}
    new_schedule.blocks = sorted(by_id.values(), key=lambda b: (b.section_id, b.start_slot))
    for d in diffs:
        if d.new_window is None and d.task_id not in new_schedule.unscheduled:
            new_schedule.unscheduled.append(d.task_id)
    return new_schedule


class Rescheduler:
    """
    Consumes DelayEvents against the current schedule.
    Every change emits a human-approvable RescheduleDiff — never auto-commits silently.
    """

    def __init__(
        self,
        schedule: ScheduleResult,
        clusters: Sequence[SuperTask],
        availability: dict[str, np.ndarray],
        slot_minutes: int = 30,
    ):
        self.schedule = copy.deepcopy(schedule)
        self.clusters_by_id = {c.cluster_id: c for c in clusters}
        self.base_availability = {sid: g.copy() for sid, g in availability.items()}
        self.availability = {sid: g.copy() for sid, g in availability.items()}
        self.slot_minutes = slot_minutes
        self.pending_diffs: list[RescheduleDiff] = []
        self.audit_log: list[RescheduleDiff] = []

    def handle_event(self, event: DelayEvent) -> list[RescheduleDiff]:
        """Process one DelayEvent; return diffs awaiting human approval."""
        self.availability = _availability_with_delay(
            self.availability, event, self.slot_minutes
        )
        near = _blocks_near_delay(self.schedule, event, self.slot_minutes)
        if not near:
            return []

        reason = (
            f"train {event.train_id} delayed {event.delay_minutes:.0f} min "
            f"on {event.section_id}"
        )
        diffs: list[RescheduleDiff] = []

        # --- Tier 1: absorb via buffer ---
        still_conflict = []
        for b in near:
            if tier1_absorb(b, self.availability[b.section_id]):
                diffs.append(
                    RescheduleDiff(
                        task_id=b.cluster_id,
                        old_window=(b.start_slot, b.end_slot),
                        new_window=(b.start_slot, b.end_slot),
                        reason=reason + " (absorbed by buffer)",
                        tier_used=1,
                    )
                )
            else:
                still_conflict.append(b)

        if not still_conflict:
            self.pending_diffs.extend(diffs)
            self.audit_log.extend(diffs)
            return diffs

        # --- Tier 2: scoped re-solve ---
        new_blocks, t2_diffs, ok = _tier2_scoped_resolve(
            self.schedule,
            self.clusters_by_id,
            self.availability,
            still_conflict,
            event,
            self.slot_minutes,
        )
        if ok and (new_blocks or t2_diffs):
            # Dropped tasks count as valid Tier-2 outcomes; prefer over greedy
            # only when at least one block was re-placed or explicitly shifted.
            if new_blocks:
                self.pending_diffs.extend(t2_diffs)
                self.audit_log.extend(t2_diffs)
                self._proposed_schedule = apply_reschedule(
                    self.schedule, t2_diffs, event.section_id, new_blocks
                )
                return t2_diffs

        # --- Tier 3: greedy fallback ---
        new_blocks, t3_diffs = _tier3_greedy(
            self.schedule,
            self.availability,
            still_conflict,
            event,
            self.slot_minutes,
        )
        self.pending_diffs.extend(t3_diffs)
        self.audit_log.extend(t3_diffs)
        self._proposed_schedule = apply_reschedule(
            self.schedule, t3_diffs, event.section_id, new_blocks
        )
        return t3_diffs

    def approve_pending(self) -> ScheduleResult:
        """Human approver commits pending diffs."""
        if hasattr(self, "_proposed_schedule") and self._proposed_schedule is not None:
            self.schedule = self._proposed_schedule
            self._proposed_schedule = None
        self.pending_diffs.clear()
        return self.schedule

    def reject_pending(self) -> None:
        """Human approver rejects — discard proposal, keep current schedule."""
        self._proposed_schedule = None
        self.pending_diffs.clear()


def process_delay_stream(
    schedule: ScheduleResult,
    clusters: Sequence[SuperTask],
    availability: dict[str, np.ndarray],
    events: Sequence[DelayEvent],
    slot_minutes: int = 30,
    auto_approve: bool = True,
    max_events: Optional[int] = None,
) -> tuple[ScheduleResult, list[RescheduleDiff]]:
    """
    Run the rescheduler over a delay stream.
    auto_approve=True simulates an approver accepting every proposed diff (demo mode).
    """
    engine = Rescheduler(schedule, clusters, availability, slot_minutes)
    all_diffs: list[RescheduleDiff] = []
    count = 0
    for event in events:
        if max_events is not None and count >= max_events:
            break
        diffs = engine.handle_event(event)
        if diffs:
            count += 1
            all_diffs.extend(diffs)
            if auto_approve:
                engine.approve_pending()
            else:
                # In non-auto mode still clear proposal to keep streaming
                engine.reject_pending()
                break
    return engine.schedule, all_diffs


if __name__ == "__main__":
    from block_planner.criticality import run_criticality_pipeline
    from block_planner.data_gen import generate_scenario
    from block_planner.scheduler import solve_weekly
    from block_planner.simulator import simulate_delays

    sc = generate_scenario(seed=42, n_per_dept=8)
    _, clusters, _ = run_criticality_pipeline(sc["tasks"], sc["sections"])
    schedule = solve_weekly(clusters, sc["sections"], sc["availability"])
    events = simulate_delays(
        sc["trains"], sc["horizon_slots"] * sc["slot_minutes"], seed=99
    )
    new_sched, diffs = process_delay_stream(
        schedule, clusters, sc["availability"], events, max_events=15
    )
    print(f"Processed diffs: {len(diffs)}")
    for d in diffs[:10]:
        print(f"  tier={d.tier_used} {d.task_id} {d.old_window} → {d.new_window} | {d.reason}")
