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


if __name__ == "__main__":
    unittest.main()
