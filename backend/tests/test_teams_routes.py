import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from config.db import get_db
from server.main import app
from server.routes import teams as teams_route


class TestTeamsRoutes(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_db] = lambda: object()
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_group_standings_defaults_missing_team_fields(self):
        teams = [
            SimpleNamespace(
                name=None,
                code=None,
                matches_played=None,
                matches_won=None,
                matches_drawn=None,
                matches_lost=None,
                goals_for=None,
                goals_against=None,
                points=None,
                group="A",
                fifa_ranking=None,
                elo_rating=None,
            )
        ]

        with patch.object(teams_route, "get_all_teams", return_value=teams):
            response = self.client.get("/teams/groups?name=A")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload, [teams_route.TeamStandingResponse(
            name="",
            code="",
            matches_played=0,
            matches_won=0,
            matches_drawn=0,
            matches_lost=0,
            goals_for=0,
            goals_against=0,
            goal_difference=0,
            points=0,
            group="A",
            fifa_ranking=None,
            elo_rating=None,
        ).model_dump()])

    def test_group_standings_uses_group_query_parameter(self):
        teams = [
            SimpleNamespace(
                name="Team B",
                code="B",
                matches_played=2,
                matches_won=1,
                matches_drawn=0,
                matches_lost=1,
                goals_for=3,
                goals_against=2,
                points=3,
                group="B",
                fifa_ranking=10,
                elo_rating=1500.0,
            )
        ]

        with patch.object(teams_route, "get_all_teams", return_value=teams) as mock_get_all_teams:
            response = self.client.get("/teams/groups?group=B")

        self.assertEqual(response.status_code, 200)
        mock_get_all_teams.assert_called_once()
        self.assertEqual(mock_get_all_teams.call_args.kwargs["group"], "B")
        payload = response.json()
        self.assertEqual(payload[0]["group"], "B")

    def test_team_top_performers_returns_404_for_unknown_team(self):
        with patch.object(teams_route, "get_team_by_code", return_value=None):
            response = self.client.get("/teams/ZZZ/top-performers")

        self.assertEqual(response.status_code, 404)

    def test_team_top_performers_returns_payload(self):
        team = SimpleNamespace(code="ARG")
        rating_player = SimpleNamespace(
            id=1,
            name="Player One",
            date_of_birth=None,
            classification=None,
            club_name=None,
            positions="FW",
            weight_kg=None,
            height_cm=None,
            foot=None,
            country_code="ARG",
            market_value=None,
            rating=7.5,
            stats_json={"rating": 7.5, "goals": 2, "assists": 1, "big_chances_created": 3},
        )

        with patch.object(teams_route, "get_team_by_code", return_value=team), patch.object(
            teams_route,
            "get_team_top_performers",
            return_value={
                "rating": [rating_player],
                "goals": [rating_player],
                "assists": [rating_player],
                "big_chances_created": [rating_player],
            },
        ), patch.object(
            teams_route,
            "_build_team_top_performer_entry",
            side_effect=lambda player, stat_key, cast_type: {
                "id": player.id,
                "name": player.name,
                "country_code": player.country_code,
                "image_url": "/players/1/image",
                "classification": player.classification,
                "positions": player.positions,
                stat_key: cast_type(player.stats_json.get(stat_key, 0) or 0),
            },
        ):
            response = self.client.get("/teams/ARG/top-performers")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["rating"]["name"], "Player One")
        self.assertEqual(payload["goals"]["goals"], 2)
        self.assertEqual(payload["assists"]["assists"], 1)
        self.assertEqual(payload["big_chances_created"]["big_chances_created"], 3)

    def test_team_statistics_rank_returns_payload(self):
        team = SimpleNamespace(code="ARG")
        rank_data = {
            "team_code": "ARG",
            "total_teams": 48,
            "goals": {"value": 10.0, "rank": 3},
            "pass_accuracy": {"value": 88.5, "rank": 5},
            "chances_created": {"value": 20.0, "rank": 2},
            "discipline": {"value": 4.0, "rank": 12},
        }

        with patch.object(teams_route, "get_team_by_code", return_value=team), patch.object(
            teams_route, "get_team_statistics_rank", return_value=rank_data
        ):
            response = self.client.get("/teams/ARG/statistics-rank")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["team_code"], "ARG")
        self.assertEqual(payload["goals"]["rank"], 3)


if __name__ == "__main__":
    unittest.main()
