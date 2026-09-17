import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from accessibility import (
    band_for_minutes,
    composite_score,
    haversine_m,
    point_in_ring,
    purpose_score,
    score_origin,
    time_score,
)


SQUARE = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]


class GeoTests(unittest.TestCase):
    def test_haversine_budapest_block(self):
        # Roughly 220 m east along Wesselényi.
        d = haversine_m(19.0613, 47.4965, 19.0642, 47.4965)
        self.assertGreater(d, 180)
        self.assertLess(d, 280)

    def test_point_in_ring(self):
        self.assertTrue(point_in_ring(0.5, 0.5, SQUARE))
        self.assertFalse(point_in_ring(1.5, 0.5, SQUARE))


class ScoreTests(unittest.TestCase):
    def test_bands(self):
        self.assertEqual(band_for_minutes(5, 1), "high")
        self.assertEqual(band_for_minutes(12, 1), "medium")
        self.assertEqual(band_for_minutes(20, 1), "low")
        self.assertEqual(band_for_minutes(40, 1), "poor")
        self.assertEqual(band_for_minutes(50, 1), "none")
        self.assertEqual(band_for_minutes(5, 0), "none")

    def test_capacity_and_reach_can_zero_a_nearby_kitchen(self):
        nearby = time_score(3)
        self.assertGreater(nearby, 90)
        self.assertEqual(purpose_score(3, reach=0, window=1, capacity=1), 0)
        starved = purpose_score(3, reach=1, window=1, capacity=781 / 2200)
        self.assertLess(starved, 40)

    def test_shopping_window_scales_yellow_star_food(self):
        full_day = purpose_score(10, 1, 1, 1)
        three_hours = purpose_score(10, 1, 3 / 12, 1)
        self.assertAlmostEqual(three_hours, full_day * 0.25, places=4)

    def test_composite_weights(self):
        self.assertAlmostEqual(composite_score({"food": 100, "medical": 0, "work": 0}), 45)
        self.assertAlmostEqual(composite_score({"food": 0, "medical": 100, "work": 0}), 35)

    def test_wall_makes_outside_hospital_unreachable_without_gates(self):
        dests = {
            "food": [{"id": "k", "lon": 0.4, "lat": 0.4, "inPestGhetto": True}],
            "medical": [{"id": "h", "lon": 1.4, "lat": 0.5, "inPestGhetto": False}],
            "work": [{"id": "w", "lon": 0.4, "lat": 0.4, "inPestGhetto": True}],
        }
        sealed = score_origin(
            (0.4, 0.4),
            destinations_by_purpose=dests,
            walk_kmh=3.0,
            window=1.0,
            capacity_by_purpose={"food": 1, "medical": 1, "work": 1},
            permitted_region=SQUARE,
            dest_region_key="inPestGhetto",
            gates=[],
            permit_reach=0.08,
        )
        self.assertEqual(sealed["detail"]["medical"]["reach"], 0)
        self.assertEqual(sealed["detail"]["medical"]["band"], "none")
        self.assertGreater(sealed["detail"]["food"]["score"], 0)

    def test_gate_path_is_longer_and_discounted(self):
        dests = {
            "food": [{"id": "k", "lon": 0.2, "lat": 0.2, "inPestGhetto": True}],
            "medical": [{"id": "h", "lon": 1.5, "lat": 0.5, "inPestGhetto": False}],
            "work": [{"id": "w", "lon": 0.2, "lat": 0.2, "inPestGhetto": True}],
        }
        gated = score_origin(
            (0.2, 0.2),
            destinations_by_purpose=dests,
            walk_kmh=5.0,
            window=1.0,
            capacity_by_purpose={"food": 1, "medical": 1, "work": 1},
            permitted_region=SQUARE,
            dest_region_key="inPestGhetto",
            gates=[{"lon": 1.0, "lat": 0.5, "open": True}],
            permit_reach=0.08,
        )
        self.assertGreater(gated["detail"]["medical"]["minutes"], 0)
        self.assertLess(gated["detail"]["medical"]["reach"], 0.1)
        self.assertLess(gated["medical"], gated["food"])


if __name__ == "__main__":
    unittest.main()
