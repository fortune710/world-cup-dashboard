import unittest
from datetime import datetime

from pipeline.transformations.elo import EloTransformations


class TestEloTransformations(unittest.TestCase):
    def setUp(self):
        self.transformer = EloTransformations()
        self.teams = [
            {"code": "ARG", "elo_rating": 1500.0},
            {"code": "BRA", "elo_rating": 1500.0},
            {"code": "CAN", "elo_rating": 1500.0},
        ]

    def test_equal_rated_winner_gains_and_loser_loses(self):
        matches = [
            {
                "id": 1,
                "round": "group",
                "home_team_code": "ARG",
                "away_team_code": "BRA",
                "kickoff_utc": datetime(2026, 6, 11, 20, 0),
                "status": "completed",
                "home_score": 2,
                "away_score": 1,
                "home_pen": None,
                "away_pen": None,
            }
        ]

        result = self.transformer.calculate_ratings(self.teams, matches)

        self.assertGreater(result["team_ratings"]["ARG"], 1500.0)
        self.assertLess(result["team_ratings"]["BRA"], 1500.0)
        self.assertEqual(len(result["history"]), 2)
        self.assertAlmostEqual(result["history"][0]["rating_delta"], 10.7981, places=3)
        self.assertAlmostEqual(result["history"][1]["rating_delta"], -10.7981, places=3)

    def test_draw_exchanges_points_from_home_to_away_when_equal_rated(self):
        matches = [
            {
                "id": 10,
                "round": "group",
                "home_team_code": "ARG",
                "away_team_code": "BRA",
                "kickoff_utc": datetime(2026, 6, 11, 20, 0),
                "status": "completed",
                "home_score": 1,
                "away_score": 1,
                "home_pen": None,
                "away_pen": None,
            }
        ]

        result = self.transformer.calculate_ratings(self.teams, matches)

        # Home team (ARG) expected ~0.640, actual 0.5. Base delta is -4.202.
        # With +5.0 draw bonus, ARG gains +0.798 (ends up with 1500.798)
        self.assertAlmostEqual(result["team_ratings"]["ARG"], 1500.7981, places=3)
        
        # Away team (BRA) expected ~0.360, actual 0.5. Base delta is +4.202.
        # With +5.0 draw bonus, BRA gains +9.202 (ends up with 1509.202)
        self.assertAlmostEqual(result["team_ratings"]["BRA"], 1509.2019, places=3)
        
        # Check that the sum of ratings increases by 2 * 5.0 = 10.0 (3010.0)
        self.assertAlmostEqual(
            result["team_ratings"]["ARG"] + result["team_ratings"]["BRA"],
            3010.0,
            places=3
        )

    def test_underdog_win_moves_more_than_favorite_win(self):
        teams = [
            {"code": "ARG", "elo_rating": 1700.0},
            {"code": "CAN", "elo_rating": 1300.0},
        ]
        matches = [
            {
                "id": 2,
                "round": "group",
                "home_team_code": "CAN",
                "away_team_code": "ARG",
                "kickoff_utc": datetime(2026, 6, 12, 20, 0),
                "status": "completed",
                "home_score": 1,
                "away_score": 0,
                "home_pen": None,
                "away_pen": None,
            }
        ]

        result = self.transformer.calculate_ratings(teams, matches, use_existing_ratings=True)

        self.assertGreater(result["team_ratings"]["CAN"], 1325.0)
        self.assertLess(result["team_ratings"]["ARG"], 1675.0)

    def test_recalculation_ignores_current_team_elo_by_default(self):
        teams = [
            {"code": "ARG", "elo_rating": 1600.0},
            {"code": "BRA", "elo_rating": 1400.0},
        ]

        result = self.transformer.calculate_ratings(teams, [])

        self.assertEqual(result["team_ratings"]["ARG"], 1500.0)
        self.assertEqual(result["team_ratings"]["BRA"], 1500.0)

    def test_penalty_win_is_softened(self):
        normal_win = [
            {
                "id": 3,
                "round": "round of 16",
                "home_team_code": "ARG",
                "away_team_code": "BRA",
                "kickoff_utc": datetime(2026, 6, 29, 20, 0),
                "status": "completed",
                "home_score": 1,
                "away_score": 0,
                "home_pen": None,
                "away_pen": None,
            }
        ]
        penalty_win = [
            {
                "id": 4,
                "round": "round of 16",
                "home_team_code": "ARG",
                "away_team_code": "BRA",
                "kickoff_utc": datetime(2026, 6, 29, 20, 0),
                "status": "completed",
                "home_score": 1,
                "away_score": 1,
                "home_pen": 5,
                "away_pen": 4,
            }
        ]

        normal_result = self.transformer.calculate_ratings(self.teams, normal_win)
        penalty_result = self.transformer.calculate_ratings(self.teams, penalty_win)

        self.assertGreater(
            normal_result["team_ratings"]["ARG"] - 1500.0,
            penalty_result["team_ratings"]["ARG"] - 1500.0,
        )

    def test_recalculation_is_idempotent_and_chronological(self):
        matches = [
            {
                "id": 6,
                "round": "group",
                "home_team_code": "CAN",
                "away_team_code": "BRA",
                "kickoff_utc": datetime(2026, 6, 13, 20, 0),
                "status": "completed",
                "home_score": 0,
                "away_score": 3,
                "home_pen": None,
                "away_pen": None,
            },
            {
                "id": 5,
                "round": "group",
                "home_team_code": "ARG",
                "away_team_code": "CAN",
                "kickoff_utc": datetime(2026, 6, 11, 20, 0),
                "status": "completed",
                "home_score": 2,
                "away_score": 0,
                "home_pen": None,
                "away_pen": None,
            },
        ]

        first = self.transformer.calculate_ratings(self.teams, matches)
        second = self.transformer.calculate_ratings(self.teams, matches)

        self.assertEqual(first, second)
        self.assertEqual([row["match_id"] for row in first["history"][::2]], [5, 6])


if __name__ == "__main__":
    unittest.main()
