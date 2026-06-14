import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient

from config.db import get_db
from server.main import app
from server.routes import matches as matches_route
from db.controllers import matches as matches_controller


class FakeQuery:
    def __init__(self, row):
        self.row = row
        self.join_args = None
        self.filter_args = None
        self.order_by_args = None
        self.limit_value = None

    def join(self, *args):
        self.join_args = args
        return self

    def filter(self, *args):
        self.filter_args = args
        return self

    def order_by(self, *args):
        self.order_by_args = args
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def first(self):
        return self.row


class FakeDateQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filter_args = []
        self.order_by_args = None
        self.options_args = None

    def options(self, *args):
        self.options_args = args
        return self

    def filter(self, *args):
        self.filter_args.extend(args)
        return self

    def order_by(self, *args):
        self.order_by_args = args
        return self

    def all(self):
        return self.rows


class TestMatchesStatisticsRoute(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_db] = lambda: object()
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_matchday_statistics_returns_top_leaders_for_date(self):
        rows = [
            {"stat_name": "rating", "value": 8.7, "player_name": "Player One"},
            {"stat_name": "goal_contributions", "value": 3, "player_name": "Player Two"},
            {"stat_name": "pass_accuracy", "value": 92, "player_name": "Player Three"},
        ]

        with patch.object(matches_route, "get_matchday_statistics_by_date", return_value=rows):
            response = self.client.get("/matches/2026-06-11/statistics")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), rows)

    def test_matchday_statistics_rejects_invalid_date_path_parameter(self):
        response = self.client.get("/matches/not-a-date/statistics")

        self.assertEqual(response.status_code, 422)

    def test_matches_route_responds_without_redirect(self):
        rows = [
            SimpleNamespace(
                id=1,
                round="Group",
                group="A",
                home_team_code="AAA",
                away_team_code="BBB",
                stadium="National Stadium",
                kickoff_utc="2026-06-11T00:00:00",
                status="scheduled",
                phase=None,
                home_score=0,
                away_score=0,
                home_pen=None,
                away_pen=None,
                home_team=None,
                away_team=None,
            )
        ]

        with patch.object(matches_route, "get_all_matches", return_value=rows):
            response = self.client.get("/matches?page=1&page_size=5", follow_redirects=False)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.history, [])
        self.assertEqual(response.json()[0]["id"], 1)

    def test_matches_route_defaults_missing_stadium(self):
        rows = [
            SimpleNamespace(
                id=1,
                round="Group",
                group="A",
                home_team_code="AAA",
                away_team_code="BBB",
                stadium=None,
                kickoff_utc="2026-06-11T00:00:00",
                status="scheduled",
                phase=None,
                home_score=0,
                away_score=0,
                home_pen=None,
                away_pen=None,
                home_team=None,
                away_team=None,
            )
        ]

        with patch.object(matches_route, "get_all_matches", return_value=rows):
            response = self.client.get("/matches?page=1&page_size=5", follow_redirects=False)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["stadium"], None)

    def test_matches_by_date_route_forwards_status_filter(self):
        rows = [
            SimpleNamespace(
                id=7,
                round="Group",
                group="B",
                home_team_code="AAA",
                away_team_code="BBB",
                stadium="National Stadium",
                kickoff_utc="2026-06-11T18:00:00",
                status="live",
                phase=None,
                home_score=1,
                away_score=0,
                home_pen=None,
                away_pen=None,
                home_team=None,
                away_team=None,
            )
        ]

        with patch.object(matches_route, "get_matches_by_date", return_value=rows) as mock_get_matches:
            response = self.client.get("/matches/2026-06-11?status=live")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["id"], 7)
        mock_get_matches.assert_called_once()
        self.assertEqual(mock_get_matches.call_args.kwargs["status"], "live")


class TestMatchesStatisticsController(unittest.TestCase):
    def test_get_matchday_statistics_by_date_returns_top_one_per_metric(self):
        fake_queries = [
            FakeQuery(SimpleNamespace(player_name="Player One", value=8.7)),
            FakeQuery(SimpleNamespace(player_name="Player Two", value=3)),
            FakeQuery(SimpleNamespace(player_name="Player Three", value=92)),
        ]
        fake_db = Mock()
        fake_db.query.side_effect = fake_queries

        result = matches_controller.get_matchday_statistics_by_date(fake_db, date(2026, 6, 11))

        self.assertEqual(
            result,
            [
                {"stat_name": "rating", "value": 8.7, "player_name": "Player One"},
                {"stat_name": "goal_contributions", "value": 3, "player_name": "Player Two"},
                {"stat_name": "pass_accuracy", "value": 92, "player_name": "Player Three"},
            ],
        )
        self.assertEqual(len(fake_queries), 3)
        for fake_query in fake_queries:
            self.assertEqual(fake_query.limit_value, 1)
            self.assertIsNotNone(fake_query.join_args)
            self.assertIsNotNone(fake_query.filter_args)
            self.assertIsNotNone(fake_query.order_by_args)
            self.assertTrue(any("match_date" in str(arg) for arg in fake_query.filter_args))
            self.assertTrue(any("player_id" in str(arg) for arg in fake_query.join_args))

    def test_get_matches_by_date_filters_date_and_status(self):
        rows = [
            SimpleNamespace(
                id=1,
                status="live",
                kickoff_utc=date(2026, 6, 11),
            )
        ]
        fake_query = FakeDateQuery(rows)
        fake_db = Mock()
        fake_db.query.return_value = fake_query

        result = matches_controller.get_matches_by_date(fake_db, date(2026, 6, 11), status="live")

        self.assertEqual(result, rows)
        self.assertIsNotNone(fake_query.options_args)
        self.assertIsNotNone(fake_query.order_by_args)
        self.assertTrue(any("kickoff_utc" in str(arg) for arg in fake_query.filter_args))
        self.assertTrue(any("status" in str(arg) for arg in fake_query.filter_args))


if __name__ == "__main__":
    unittest.main()
