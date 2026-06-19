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


if __name__ == "__main__":
    unittest.main()
