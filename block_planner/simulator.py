"""Component C — Synthetic live delay simulator (discrete-event)."""

from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Iterator, Optional, Sequence

import numpy as np

from block_planner.models import DelayEvent, Train

# Delay distribution params
PAX_MU, PAX_SIGMA = 1.2, 0.45          # lognormal → ~few minutes typical
FREIGHT_MU, FREIGHT_SIGMA = 1.8, 0.70  # higher variance
PEAK_SIGMA_MULT = 1.5
DISRUPTION_DAY_PROB = 0.08
DISRUPTION_MULT = 3.5
CASCADE_FRACTION = (0.3, 0.6)
HEADWAY_MINUTES = 12.0
DELAY_EMIT_THRESHOLD = 5.0  # minutes


@dataclass(order=True)
class _Event:
    time: float
    seq: int
    train_id: str = field(compare=False)
    section_id: str = field(compare=False)
    planned_time: float = field(compare=False)
    leg_index: int = field(compare=False)


def _is_peak(minute_of_day: float) -> bool:
    hour = (minute_of_day % (24 * 60)) / 60.0
    return (7.0 <= hour <= 10.0) or (17.0 <= hour <= 21.0)


def sample_primary_delay(
    train_type: str,
    planned_time: float,
    disruption_day: bool,
    rng: np.random.Generator,
) -> float:
    if train_type == "freight":
        mu, sigma = FREIGHT_MU, FREIGHT_SIGMA
    else:
        mu, sigma = PAX_MU, PAX_SIGMA
    if _is_peak(planned_time):
        sigma *= PEAK_SIGMA_MULT
    delay = float(rng.lognormal(mu, sigma))
    if disruption_day:
        delay *= DISRUPTION_MULT
    return delay


class DelaySimulator:
    """
    Discrete-event process over a synthetic timetable.

    Advance clock → update each train's actual ETA per section → emit
    DelayEvent whenever deviation exceeds DELAY_EMIT_THRESHOLD.
    Cascading: following trains on the same section within HEADWAY_MINUTES
    inherit a fraction of the upstream delay.
    """

    def __init__(
        self,
        trains: Sequence[Train],
        horizon_minutes: float,
        seed: int = 42,
        disruption_day_prob: float = DISRUPTION_DAY_PROB,
        emit_threshold: float = DELAY_EMIT_THRESHOLD,
    ):
        self.trains = list(trains)
        self.horizon_minutes = horizon_minutes
        self.rng = np.random.default_rng(seed)
        self.disruption_day_prob = disruption_day_prob
        self.emit_threshold = emit_threshold
        self._seq = 0

    def _disruption_flags(self) -> dict[int, bool]:
        """Per-calendar-day disruption flag over the horizon."""
        n_days = int(math_ceil(self.horizon_minutes / (24 * 60))) + 1
        return {
            d: bool(self.rng.random() < self.disruption_day_prob) for d in range(n_days)
        }

    def run(self) -> list[DelayEvent]:
        return list(self.iter_events())

    def iter_events(self) -> Iterator[DelayEvent]:
        disruption = self._disruption_flags()
        # Actual arrival time per (train_id, leg_index)
        actual: dict[tuple[str, int], float] = {}
        # Section occupancy log: list of (actual_arrival, train_id, delay) sorted later
        section_arrivals: dict[str, list[tuple[float, str, float]]] = {}

        pq: list[_Event] = []
        train_by_id = {t.train_id: t for t in self.trains}

        for train in self.trains:
            if not train.scheduled_path:
                continue
            section_id, planned = train.scheduled_path[0]
            self._seq += 1
            heapq.heappush(
                pq,
                _Event(planned, self._seq, train.train_id, section_id, planned, 0),
            )

        events: list[DelayEvent] = []

        while pq:
            ev = heapq.heappop(pq)
            if ev.time > self.horizon_minutes + 180:
                continue

            train = train_by_id[ev.train_id]
            day = int(ev.planned_time // (24 * 60))
            is_disruption = disruption.get(day, False)

            primary = sample_primary_delay(
                train.train_type, ev.planned_time, is_disruption, self.rng
            )

            # Inherit delay from previous leg of same train
            inherited = 0.0
            if ev.leg_index > 0:
                prev_key = (ev.train_id, ev.leg_index - 1)
                if prev_key in actual:
                    prev_planned = train.scheduled_path[ev.leg_index - 1][1]
                    inherited = max(0.0, actual[prev_key] - prev_planned)

            # Cascade from earlier trains on same section within headway
            cascade = 0.0
            prior = section_arrivals.get(ev.section_id, [])
            for arr_t, other_id, other_delay in prior:
                if other_id == ev.train_id:
                    continue
                if abs(arr_t - ev.planned_time) <= HEADWAY_MINUTES or (
                    0 < ev.planned_time - arr_t <= HEADWAY_MINUTES * 2
                ):
                    frac = float(self.rng.uniform(*CASCADE_FRACTION))
                    cascade = max(cascade, frac * other_delay)

            delay = primary + inherited * 0.5 + cascade
            actual_time = ev.planned_time + delay
            actual[(ev.train_id, ev.leg_index)] = actual_time
            section_arrivals.setdefault(ev.section_id, []).append(
                (actual_time, ev.train_id, delay)
            )

            if delay >= self.emit_threshold:
                events.append(
                    DelayEvent(
                        train_id=ev.train_id,
                        section_id=ev.section_id,
                        planned_time=ev.planned_time,
                        actual_time=actual_time,
                        delay_minutes=delay,
                    )
                )
                yield events[-1]

            # Schedule next leg
            next_leg = ev.leg_index + 1
            if next_leg < len(train.scheduled_path):
                next_sec, next_planned = train.scheduled_path[next_leg]
                # Event fires at max(planned, previous actual + min transit)
                fire_at = max(next_planned, actual_time + 5.0)
                self._seq += 1
                heapq.heappush(
                    pq,
                    _Event(
                        fire_at,
                        self._seq,
                        ev.train_id,
                        next_sec,
                        next_planned,
                        next_leg,
                    ),
                )


def math_ceil(x: float) -> int:
    import math

    return int(math.ceil(x))


def simulate_delays(
    trains: Sequence[Train],
    horizon_minutes: float,
    seed: int = 42,
) -> list[DelayEvent]:
    """Convenience wrapper returning the full DelayEvent stream."""
    return DelaySimulator(trains, horizon_minutes, seed=seed).run()


if __name__ == "__main__":
    from block_planner.data_gen import generate_scenario

    sc = generate_scenario(seed=1)
    horizon = sc["horizon_slots"] * sc["slot_minutes"]
    events = simulate_delays(sc["trains"], horizon, seed=1)
    print(f"Emitted {len(events)} delay events (threshold={DELAY_EMIT_THRESHOLD} min)")
    if events:
        delays = [e.delay_minutes for e in events]
        print(f"  mean={np.mean(delays):.1f} max={np.max(delays):.1f} min={np.min(delays):.1f}")
        print(f"  sample: {events[0]}")
