import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from config.db import get_db
from server.main import app
from server.routes import players as players_route


class TestPlayerMatchHistoryRoute(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("postgresql://postgres:postgres@localhost:5432/world_cup_db")
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        def override_get_db():
            db = self.Session()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        with self.engine.begin() as conn:
            conn.execute(text(
                "INSERT INTO teams (id, name, code, \"group\") VALUES "
                "(910001, 'Test Home', 'THM', 'Z'), (910002, 'Test Away', 'TAW', 'Z'), "
                "(910003, 'Test Third', 'TTH', 'Z') "
                "ON CONFLICT (id) DO NOTHING"
            ))
            conn.execute(text(
                "INSERT INTO players (id, name, country_code, positions, classification, rating, stats_json) "
                "VALUES (910099, 'Test Player', 'THM', 'ST', 'F', 8.0, '{}'::jsonb) "
                "ON CONFLICT (id) DO UPDATE SET stats_json = EXCLUDED.stats_json"
            ))
            conn.execute(text(
                "INSERT INTO matches (id, round, \"group\", home_team_code, away_team_code, "
                "kickoff_utc, status, home_score, away_score, sofascore_id) VALUES "
                "(910001, 'Group', 'Z', 'THM', 'TAW', '2026-06-12 18:00:00', 'completed', 2, 0, 5910001), "
                "(910002, 'Round of 32', NULL, 'TAW', 'THM', '2026-06-30 18:00:00', 'completed', 1, 2, 5910002), "
                "(910003, 'Quarter-final', NULL, 'THM', 'TTH', '2026-07-15 18:00:00', 'scheduled', NULL, NULL, 5910003) "
                "ON CONFLICT (id) DO NOTHING"
            ))
            conn.execute(text(
                "INSERT INTO matchday_stats (player_id, match_id, match_date, statistics) VALUES "
                "(910099, 5910001, '2026-06-12', "
                "'{\"rating\": 8.5, \"minutes_played\": 90, \"goal_contributions\": 2, "
                "\"total_tackle\": 1, \"interception_won\": 0, \"pass_accuracy\": 88}'::jsonb) "
                "ON CONFLICT DO NOTHING"
            ))

    def tearDown(self):
        with self.engine.begin() as conn:
            conn.execute(text("DELETE FROM matchday_stats WHERE player_id = 910099"))
            conn.execute(text("DELETE FROM matches WHERE id BETWEEN 910001 AND 910003"))
            conn.execute(text("DELETE FROM players WHERE id = 910099"))
            conn.execute(text("DELETE FROM teams WHERE id BETWEEN 910001 AND 910003"))
        app.dependency_overrides.clear()

    def test_returns_only_completed_matches_in_chronological_order(self):
        response = self.client.get("/players/910099/match-history")

        self.assertEqual(response.status_code, 200)
        matches = response.json()["matches"]
        self.assertEqual(len(matches), 2)
        self.assertEqual([m["match_id"] for m in matches], [910001, 910002])

    def test_includes_round_of_32_and_excludes_scheduled_matches(self):
        response = self.client.get("/players/910099/match-history")
        rounds = [m["round"] for m in response.json()["matches"]]

        self.assertIn("Round of 32", rounds)
        self.assertNotIn("Quarter-final", rounds)

    def test_derives_correct_opponent_and_clean_sheet_from_real_scores(self):
        response = self.client.get("/players/910099/match-history")
        matches = response.json()["matches"]

        home_match = next(m for m in matches if m["match_id"] == 910001)
        self.assertEqual(home_match["opponent"], "TAW")
        self.assertEqual(home_match["team_score"], 2)
        self.assertEqual(home_match["opponent_score"], 0)
        self.assertTrue(home_match["clean_sheet"])

        away_match = next(m for m in matches if m["match_id"] == 910002)
        self.assertEqual(away_match["opponent"], "TAW")
        self.assertEqual(away_match["team_score"], 2)
        self.assertEqual(away_match["opponent_score"], 1)
        self.assertFalse(away_match["clean_sheet"])

    def test_attaches_real_matchday_stats_when_available(self):
        response = self.client.get("/players/910099/match-history")
        matches = response.json()["matches"]

        with_stats = next(m for m in matches if m["match_id"] == 910001)
        self.assertTrue(with_stats["has_player_stats"])
        self.assertEqual(with_stats["rating"], 8.5)
        self.assertEqual(with_stats["goal_contributions"], 2)

        without_stats = next(m for m in matches if m["match_id"] == 910002)
        self.assertFalse(without_stats["has_player_stats"])
        self.assertIsNone(without_stats["rating"])

    def test_returns_404_for_missing_player(self):
        with patch.object(players_route, "get_player_by_id", return_value=None):
            response = self.client.get("/players/404/match-history")

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
