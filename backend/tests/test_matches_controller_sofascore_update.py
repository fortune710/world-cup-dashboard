import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock

from db.controllers.matches import get_match_by_fixture_identity, update_match_sofascore_id
from db.controllers.matches import upsert_match


class FakeQuery:
    def __init__(self, match=None):
        self.match = match
        self.filters = []
        self.limit_value = None

    def filter(self, *args):
        self.filters.extend(args)
        return self

    def first(self):
        return self.match


class TestMatchesControllerSofascoreUpdate(unittest.TestCase):
    def test_get_match_by_fixture_identity_uses_home_away_and_kickoff_only(self):
        db_match = SimpleNamespace(id=99, home_team_code="MEX", away_team_code="RSA", kickoff_utc=datetime(2026, 6, 11, 19, 0))
        fake_query = FakeQuery(match=db_match)
        fake_db = Mock()
        fake_db.query.return_value = fake_query

        result = get_match_by_fixture_identity(
            fake_db,
            {
                "home_team_code": "MEX",
                "away_team_code": "RSA",
                "round": 1,
                "kickoff_utc": datetime(2026, 6, 11, 19, 0, tzinfo=timezone.utc),
            },
        )

        self.assertIs(result, db_match)
        self.assertEqual(len(fake_query.filters), 3)
        self.assertTrue(any("home_team_code" in str(expr) for expr in fake_query.filters))
        self.assertTrue(any("away_team_code" in str(expr) for expr in fake_query.filters))
        self.assertTrue(any("kickoff_utc" in str(expr) for expr in fake_query.filters))
        self.assertFalse(any("round" in str(expr) for expr in fake_query.filters))

    def test_update_match_sofascore_id_only_updates_sofascore_id_column(self):
        db_match = SimpleNamespace(id=99, home_team_code="MEX", away_team_code="RSA", kickoff_utc=datetime(2026, 6, 11, 19, 0))
        fake_query = FakeQuery(match=db_match)
        fake_db = Mock()
        fake_db.query.return_value = fake_query
        fake_db.execute = Mock()
        fake_db.commit = Mock()
        fake_db.rollback = Mock()

        update_match_sofascore_id(
            fake_db,
            {
                "home_team_code": "MEX",
                "away_team_code": "RSA",
                "kickoff_utc": datetime(2026, 6, 11, 19, 0, tzinfo=timezone.utc),
                "sofascore_id": 15186710,
            },
        )

        fake_db.execute.assert_called_once()
        statement = str(fake_db.execute.call_args.args[0])
        self.assertIn("UPDATE matches SET sofascore_id", statement)
        self.assertNotIn("home_team_code", statement)
        self.assertNotIn("away_team_code", statement)
        self.assertNotIn("round", statement)

    def test_upsert_match_preserves_existing_sofascore_id_when_payload_omits_it(self):
        existing_match = SimpleNamespace(
            id=99,
            round="1",
            group="A",
            home_team_code="MEX",
            away_team_code="RSA",
            stadium="Stadium",
            kickoff_utc=datetime(2026, 6, 11, 19, 0),
            status="scheduled",
            phase="group",
            home_score=0,
            away_score=0,
            home_pen=None,
            away_pen=None,
            sofascore_id=15186710,
        )
        fake_query = FakeQuery(match=existing_match)
        fake_db = Mock()
        fake_db.query.return_value = fake_query
        fake_db.commit = Mock()
        fake_db.refresh = Mock()

        payload = {
            "id": 99,
            "round": "1",
            "group": "A",
            "home_team_code": "MEX",
            "away_team_code": "RSA",
            "stadium": "Updated Stadium",
            "kickoff_utc": "2026-06-11T19:00:00Z",
            "status": "scheduled",
            "phase": "group",
            "home_score": 1,
            "away_score": 0,
            "home_pen": None,
            "away_pen": None,
        }

        result = upsert_match(fake_db, payload)

        self.assertIs(result, existing_match)
        self.assertEqual(existing_match.sofascore_id, 15186710)
        self.assertEqual(existing_match.stadium, "Updated Stadium")
        self.assertEqual(existing_match.home_score, 1)


if __name__ == "__main__":
    unittest.main()
