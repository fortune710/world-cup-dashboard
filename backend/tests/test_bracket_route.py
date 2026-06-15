import unittest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from config.db import get_db
from server.main import app
from server.routes import bracket as bracket_route


class TestBracketRoute(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_db] = lambda: object()
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_bracket_route_responds_without_trailing_slash(self):
        rounds = [
            SimpleNamespace(
                round="R32",
                matches=[
                    SimpleNamespace(
                        id=1,
                        round="R32",
                        group=None,
                        home_team_code="AAA",
                        away_team_code="BBB",
                        stadium=None,
                        kickoff_utc=datetime(2026, 6, 11, 12, 0, 0),
                        status="completed",
                        phase="knockout",
                        home_score=2,
                        away_score=1,
                        home_pen=None,
                        away_pen=None,
                        home_team=SimpleNamespace(name="Team A", code="AAA"),
                        away_team=SimpleNamespace(name="Team B", code="BBB"),
                    )
                ],
            )
        ]

        with patch.object(bracket_route, "get_bracket_matches", return_value=rounds):
            response = self.client.get("/bracket", follow_redirects=False)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.history, [])
        self.assertEqual(response.json()[0]["round"], "R32")


if __name__ == "__main__":
    unittest.main()
