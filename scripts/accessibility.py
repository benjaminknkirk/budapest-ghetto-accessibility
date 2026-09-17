"""Occupation-adapted accessibility index (OAAI).

Adapts the LUPTAI (Land Use and Public Transport Accessibility Index)
logic — origin-based scores on a grid, walking-time bands, composite of
activity purposes — to a setting where the binding constraints are legal
and physical barriers, not public-transport frequency.

LUPTAI (Pitot et al. 2006; Yigitcanlar et al. 2007) classifies walking
catchments to land-use destinations into High / Medium / Low / Poor / None
and blends purposes into a composite. Later TMR implementations express
the indicator as a simulated mean travel time.

This module keeps the banding and the composite, then adds four occupation
modifiers that LUPTAI never needed:

  reach      0 if a destination is legally unreachable (sealed wall,
             no permit path); 1 if inside the permitted region; a small
             gate factor if exit is theoretically possible with papers.
  window     fraction of a 12-hour day in which leaving home is allowed.
  capacity   supply / catchment-demand, capped at 1. Spatial proximity
             to an empty kitchen is not access to food.
  speed      walking speed falls as crowding, winter, and malnutrition
             worsen.

The composite is a weighted sum of purpose scores. Survival weights
(food 0.45, medical 0.35, work 0.20) replace SEQ household-travel weights.
"""

from __future__ import annotations

import math
from typing import Iterable, Sequence

EARTH_M = 6371000.0

# LUPTAI-style bands, expressed in walking minutes rather than metres so
# that a change in walk speed (malnutrition, ice, crowding) moves people
# between bands even if Euclidean distance is unchanged.
BANDS = (
    (8, "high"),
    (15, "medium"),
    (25, "low"),
    (45, "poor"),
    (math.inf, "none"),
)

PURPOSE_WEIGHTS = {"food": 0.45, "medical": 0.35, "work": 0.20}
UNREACHABLE_MINUTES = 180.0  # LUPTAI-like ceiling

ZERO_DETAIL = {
    "minutes": UNREACHABLE_MINUTES,
    "reach": 0.0,
    "window": 0.0,
    "capacity": 0.0,
    "score": 0.0,
    "band": "none",
    "destination": None,
}

DISPLACED_SCORE = {
    "composite": 0.0,
    "food": 0.0,
    "medical": 0.0,
    "work": 0.0,
    "displaced": True,
    "detail": {
        "food": dict(ZERO_DETAIL),
        "medical": dict(ZERO_DETAIL),
        "work": dict(ZERO_DETAIL),
    },
}


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_M * math.asin(min(1.0, math.sqrt(a)))


def point_in_ring(lon: float, lat: float, ring: Sequence[Sequence[float]]) -> bool:
    """Ray-casting PIP. Ring is [[lon, lat], ...], first vertex may repeat."""
    n = len(ring)
    if n < 4:
        return False
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        intersects = ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-18) + xi
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def minutes_for_distance(distance_m: float, walk_kmh: float) -> float:
    if walk_kmh <= 0:
        return UNREACHABLE_MINUTES
    return (distance_m / 1000.0) / walk_kmh * 60.0


def band_for_minutes(minutes: float, reachable: float) -> str:
    if reachable <= 0:
        return "none"
    for limit, name in BANDS:
        if minutes <= limit:
            return name
    return "none"


def time_score(minutes: float) -> float:
    """0–100, linear decay to the 45-minute poor/none threshold."""
    if minutes >= 45:
        return 0.0
    return max(0.0, 100.0 * (1.0 - minutes / 45.0))


def purpose_score(minutes: float, reach: float, window: float, capacity: float) -> float:
    if reach <= 0:
        return 0.0
    return time_score(minutes) * reach * window * max(0.0, min(1.0, capacity))


def composite_score(parts: dict[str, float]) -> float:
    total = 0.0
    for purpose, weight in PURPOSE_WEIGHTS.items():
        total += weight * parts.get(purpose, 0.0)
    return total


def nearest(
    origin: tuple[float, float],
    destinations: Iterable[dict],
    *,
    walk_kmh: float,
    permitted_region,
    dest_region_key: str,
    gates: Sequence[dict] | None,
    permit_reach: float,
) -> tuple[float, float, dict | None]:
    """Return (minutes, reach, destination).

    If the nearest destination is outside the origin's permitted region,
    the path must go via an open gate and is discounted by permit_reach.
    If there is no gate and the destination is outside, reach is 0.
    """
    olon, olat = origin
    best = None
    for dest in destinations:
        dlon, dlat = dest["lon"], dest["lat"]
        inside_same = False
        if permitted_region is None:
            inside_same = True
        else:
            origin_in = point_in_ring(olon, olat, permitted_region)
            dest_in = bool(dest.get(dest_region_key, point_in_ring(dlon, dlat, permitted_region)))
            inside_same = origin_in == dest_in and origin_in

        if inside_same or permitted_region is None:
            dist = haversine_m(olon, olat, dlon, dlat)
            mins = minutes_for_distance(dist, walk_kmh)
            reach = 1.0
        else:
            if not gates:
                dist = UNREACHABLE_MINUTES * 1000
                mins = UNREACHABLE_MINUTES
                reach = 0.0
            else:
                via = min(
                    haversine_m(olon, olat, g["lon"], g["lat"])
                    + haversine_m(g["lon"], g["lat"], dlon, dlat)
                    for g in gates
                    if g.get("open", True)
                )
                mins = minutes_for_distance(via, walk_kmh)
                reach = permit_reach
        candidate = (mins, reach, dest)
        if best is None or (candidate[0] / max(candidate[1], 1e-6)) < (
            best[0] / max(best[1], 1e-6)
        ):
            best = candidate
    if best is None:
        return UNREACHABLE_MINUTES, 0.0, None
    return best


def score_origin(
    origin: tuple[float, float],
    *,
    destinations_by_purpose: dict[str, list[dict]],
    walk_kmh: float,
    window: float,
    capacity_by_purpose: dict[str, float],
    permitted_region,
    dest_region_key: str,
    gates: Sequence[dict] | None,
    permit_reach: float,
) -> dict:
    parts = {}
    detail = {}
    for purpose in PURPOSE_WEIGHTS:
        dests = destinations_by_purpose.get(purpose, [])
        mins, reach, dest = nearest(
            origin,
            dests,
            walk_kmh=walk_kmh,
            permitted_region=permitted_region,
            dest_region_key=dest_region_key,
            gates=gates,
            permit_reach=permit_reach,
        )
        cap = capacity_by_purpose.get(purpose, 1.0)
        parts[purpose] = purpose_score(mins, reach, window, cap)
        detail[purpose] = {
            "minutes": round(mins, 2),
            "reach": round(reach, 3),
            "window": window,
            "capacity": round(cap, 3),
            "score": round(parts[purpose], 2),
            "band": band_for_minutes(mins, reach),
            "destination": None if dest is None else dest.get("id"),
        }
    return {
        "food": parts["food"],
        "medical": parts["medical"],
        "work": parts["work"],
        "composite": composite_score(parts),
        "detail": detail,
    }
