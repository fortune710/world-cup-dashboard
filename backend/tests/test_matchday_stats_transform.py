import unittest
from datetime import datetime, timezone

from pipeline.transformations.matchday_stats import MatchdayStatsTransformations


class TestMatchdayStatsTransformations(unittest.TestCase):
    def setUp(self):
        self.transformer = MatchdayStatsTransformations()
        self.match_context = {
            "id": 501,
            "sofascore_id": 1501,
            "match_date": datetime(2026, 6, 11, 19, 0, tzinfo=timezone.utc),
            "home_team_code": "KSA",
            "away_team_code": "JPN",
        }

    def test_transform_matchday_stats_maps_lineup_entries(self):
        home_lineup = {
            "players": [
                {
                    "player": {"id": 101, "position": "F"},
                    "statistics": {
                        "rating": "7.4",
                        "goals": "2",
                        "goalAssist": "1",
                        "accuratePass": "24",
                        "totalPass": "32",
                        "bigChancesCreated": "1",
                        "expectedGoals": "0.7",
                        "assists": "1",
                        "ratingVersions": {"original": 7.4},
                        "statisticsType": {"sportSlug": "football", "statisticsType": "player"},
                    },
                }
            ]
        }
        away_lineup = {
            "players": [
                {
                    "player": {"id": 202, "position": "D"},
                    "statistics": {
                        "rating": 6.2,
                        "goals": 0,
                        "accuratePass": 19,
                        "totalPass": 30,
                        "bigChancesCreated": 3,
                        "expected_goals": 0.1,
                        "assists": 0,
                    },
                }
            ]
        }

        rows = self.transformer.transform_matchday_stats(self.match_context, home_lineup, away_lineup)

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["player_id"], 101)
        self.assertEqual(rows[0]["match_id"], 1501)
        self.assertEqual(rows[0]["match_date"], self.match_context["match_date"])
        self.assertEqual(rows[0]["statistics"]["rating"], 7.4)
        self.assertEqual(rows[0]["statistics"]["goals"], 2)
        self.assertEqual(rows[0]["statistics"]["field"], "F")
        self.assertEqual(rows[0]["statistics"]["accurate_pass"], 24)
        self.assertEqual(rows[0]["statistics"]["total_pass"], 32)
        self.assertEqual(rows[0]["statistics"]["goal_contributions"], 1)
        self.assertEqual(rows[0]["statistics"]["pass_accuracy"], 75)
        self.assertEqual(rows[0]["statistics"]["field"], "F")
        self.assertEqual(rows[0]["statistics"]["shot_off_target"], 0)
        self.assertEqual(rows[0]["statistics"]["expected_goals"], 0.7)
        self.assertNotIn("statisticsType", rows[0]["statistics"])
        self.assertNotIn("ratingVersions", rows[0]["statistics"])

        self.assertEqual(rows[1]["player_id"], 202)
        self.assertEqual(rows[1]["statistics"]["accurate_pass"], 19)
        self.assertEqual(rows[1]["statistics"]["total_pass"], 30)
        self.assertEqual(rows[1]["statistics"]["goal_contributions"], 0)
        self.assertEqual(rows[1]["statistics"]["pass_accuracy"], 63)
        self.assertEqual(rows[1]["statistics"]["field"], "D")

    def test_transform_matchday_stats_skips_duplicate_player_ids(self):
        home_lineup = {
            "players": [
                {
                    "player": {"id": 303, "position": "M"},
                    "statistics": {"rating": 6.0, "accuratePass": 10, "totalPass": 20},
                },
                {
                    "player": {"id": 303, "position": "M"},
                    "statistics": {"rating": 7.0, "accuratePass": 11, "totalPass": 22},
                },
            ]
        }

        rows = self.transformer.transform_matchday_stats(self.match_context, home_lineup, {"players": []})

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["player_id"], 303)
        self.assertEqual(rows[0]["statistics"]["rating"], 6.0)
        self.assertEqual(rows[0]["statistics"]["accurate_pass"], 10)
        self.assertEqual(rows[0]["statistics"]["total_pass"], 20)
        self.assertEqual(rows[0]["statistics"]["pass_accuracy"], 50)
        self.assertEqual(rows[0]["statistics"]["field"], "M")


if __name__ == "__main__":
    unittest.main()
