import unittest
from datetime import datetime, timezone

from pipeline.transformations.match_id_mapping import MatchIdMappingTransformations


class TestMatchIdMappingTransformations(unittest.TestCase):
    def setUp(self):
        self.transformer = MatchIdMappingTransformations()
        self.teams = [
            {"name": "Saudi Arabia", "code": "KSA", "sofascore_id": 101},
            {"name": "Japan", "code": "JPN", "sofascore_id": 202},
            {"name": "Brazil", "code": "BRA", "sofascore_id": 303},
        ]
        self.matches = [
            {
                "id": 501,
                "home_team_code": "KSA",
                "away_team_code": "JPN",
                "kickoff_utc": datetime(2026, 6, 1, 18, 0, tzinfo=timezone.utc),
            },
            {
                "id": 502,
                "home_team_code": "JPN",
                "away_team_code": "BRA",
                "kickoff_utc": datetime(2026, 6, 2, 18, 0, tzinfo=timezone.utc),
            },
        ]

    def test_transform_maps_exact_fixture_to_internal_match(self):
        fixtures = [
            {
                "id": 9001,
                "homeTeam": {"id": 101},
                "awayTeam": {"id": 202},
                "startTimestamp": 1780336800,
                "status": {"type": "scheduled", "description": "not started"},
            }
        ]

        mapped = self.transformer.transform_fixtures_to_match_updates(self.teams, self.matches, fixtures)

        self.assertEqual(len(mapped), 1)
        self.assertEqual(mapped[0]["sofascore_id"], 9001)
        self.assertEqual(mapped[0]["match_id"], 501)
        self.assertEqual(mapped[0]["home_team_code"], "KSA")
        self.assertEqual(mapped[0]["away_team_code"], "JPN")
        self.assertEqual(mapped[0]["kickoff_utc"], datetime.fromtimestamp(1780336800, tz=timezone.utc))
        self.assertEqual(mapped[0]["fixture_status_type"], "scheduled")
        self.assertEqual(mapped[0]["fixture_status_description"], "not started")

    def test_transform_skips_fixture_when_either_team_cannot_be_resolved(self):
        fixtures = [
            {
                "id": 9002,
                "homeTeam": {"id": 101},
                "awayTeam": {"id": 999999},
                "startTimestamp": 1780336800,
                "status": {"type": "scheduled", "description": "not started"},
            }
        ]

        mapped = self.transformer.transform_fixtures_to_match_updates(self.teams, self.matches, fixtures)

        self.assertEqual(mapped, [])

    def test_transform_skips_missing_fixture_entries(self):
        mapped = self.transformer.transform_fixtures_to_match_updates(self.teams, self.matches, [None, {}])

        self.assertEqual(mapped, [])


if __name__ == "__main__":
    unittest.main()
