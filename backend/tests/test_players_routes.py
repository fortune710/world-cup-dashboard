import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from config.db import get_db
from server.main import app
from server.routes import players as players_route


class TestPlayersRoutes(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_db] = lambda: object()
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_player_statistics_returns_statistics_field(self):
        with patch.object(
            players_route,
            "get_player_by_id",
            return_value=SimpleNamespace(
                id=1,
                name="Test Player",
                stats_json={"goals": 3, "assists": 2},
            ),
        ):
            response = self.client.get("/players/1/statistics")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("statistics", payload)
        self.assertNotIn("stats_json", payload)
        self.assertEqual(payload["statistics"], {"goals": 3, "assists": 2})

    def test_top_goals_returns_top_five_players(self):
        players = [
            SimpleNamespace(
                id=idx,
                name=f"Player {idx}",
                date_of_birth=None,
                classification=None,
                club_name="Club",
                positions="ST",
                weight_kg=None,
                height_cm=None,
                foot=None,
                country_code="AAA",
                market_value=None,
                image_url=None,
                rating=None,
                stats_json={"goals": goals},
            )
            for idx, goals in enumerate([9, 8, 7, 6, 5], start=1)
        ]
        with patch.object(players_route, "get_top_players_by_goals", return_value=players):
            response = self.client.get("/players/top/goals")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 5)
        self.assertEqual(payload[0]["goals"], 9)
        self.assertEqual(payload[-1]["goals"], 5)
        self.assertNotIn("stats_json", payload[0])

    def test_top_assists_returns_top_five_players(self):
        players = [
            SimpleNamespace(
                id=idx,
                name=f"Player {idx}",
                date_of_birth=None,
                classification=None,
                club_name="Club",
                positions="ST",
                weight_kg=None,
                height_cm=None,
                foot=None,
                country_code="AAA",
                market_value=None,
                image_url=None,
                rating=None,
                stats_json={"assists": assists},
            )
            for idx, assists in enumerate([8, 7, 6, 5, 4], start=1)
        ]
        with patch.object(players_route, "get_top_players_by_assists", return_value=players):
            response = self.client.get("/players/top/assists")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 5)
        self.assertEqual(payload[0]["assists"], 8)
        self.assertEqual(payload[-1]["assists"], 4)
        self.assertNotIn("stats_json", payload[0])

    def test_top_rating_returns_top_five_players(self):
        players = [
            SimpleNamespace(
                id=idx,
                name=f"Player {idx}",
                date_of_birth=None,
                classification=None,
                club_name="Club",
                positions="ST",
                weight_kg=None,
                height_cm=None,
                foot=None,
                country_code="AAA",
                market_value=None,
                image_url=None,
                rating=rating,
                stats_json={"rating": rating},
            )
            for idx, rating in enumerate([9.5, 8.8, 8.1, 7.6, 7.1], start=1)
        ]
        with patch.object(players_route, "get_top_players_by_rating", return_value=players):
            response = self.client.get("/players/top/rating")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 5)
        self.assertEqual(payload[0]["rating"], 9.5)
        self.assertEqual(payload[-1]["rating"], 7.1)
        self.assertNotIn("stats_json", payload[0])


if __name__ == "__main__":
    unittest.main()
