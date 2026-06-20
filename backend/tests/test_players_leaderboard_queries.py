import unittest
import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)

from db.controllers import players as players_controller
from db.models.players import Player, PlayerClassification
from db.models.teams import Team


class FakeLeaderboardQuery:
    def __init__(self):
        logger.info("Initializing FakeLeaderboardQuery")
        self.join_calls = []
        self.filter_args = []
        self.order_by_args = None
        self.limit_value = None
        self.rows = [
            (
                SimpleNamespace(
                    id=1,
                    name="Player One",
                    country_code="AAA",
                    classification=PlayerClassification.F,
                    image_url="https://img.example.com/player-one.jpg",
                    stats_json={
                        "appearances": 7,
                        "minutes_played": 630,
                        "clean_sheet": 3,
                        "saves": 4,
                        "goals": 2,
                        "assists": 1,
                        "expected_goals": 1.4,
                        "expected_assists": 0.6,
                        "rating": 8.1,
                    },
                ),
                "https://img.example.com/team-a.png",
                "A",
            ),
            (
                SimpleNamespace(
                    id=2,
                    name="Player Two",
                    country_code="BBB",
                    classification=PlayerClassification.F,
                    image_url=None,
                    stats_json={
                        "appearances": 6,
                        "minutes_played": 540,
                        "clean_sheet": 2,
                        "saves": 5,
                        "goals": 1,
                        "assists": 0,
                        "expected_goals": 0.8,
                        "expected_assists": 0.2,
                        "rating": 7.7,
                    },
                ),
                "https://img.example.com/team-b.png",
                "B",
            ),
        ]

    def join(self, *args, **kwargs):
        self.join_calls.append((args, kwargs))
        return self

    def outerjoin(self, *args, **kwargs):
        self.join_calls.append((args, kwargs))
        return self

    def filter(self, *args, **kwargs):
        self.filter_args.extend(args)
        return self

    def order_by(self, *args):
        self.order_by_args = args
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def all(self):
        return self.rows


class TestPlayersLeaderboardQueries(unittest.TestCase):
    def test_get_top_players_by_clean_sheets_orders_by_stats_json_and_limits_to_five(self):
        fake_query = FakeLeaderboardQuery()
        db = MagicMock()
        db.query.return_value = fake_query

        result = players_controller.get_top_players_by_clean_sheets(db)

        self.assertEqual(result, fake_query.rows)
        self.assertEqual(fake_query.limit_value, 5)
        self.assertIsNotNone(fake_query.order_by_args)
        self.assertIn("stats_json", str(fake_query.order_by_args[0]))
        self.assertIn("clean_sheet", str(fake_query.order_by_args[0]))

    def test_get_players_leaderboard_joins_teams_filters_and_limits_in_db(self):
        fake_query = FakeLeaderboardQuery()
        db = MagicMock()
        db.query.return_value = fake_query

        result = players_controller.get_players_leaderboard(
            db,
            limit=12,
            search="Messi",
            classification=PlayerClassification.F,
        )

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["id"], 1)
        self.assertEqual(result[0]["player_name"], "Player One")
        self.assertEqual(result[0]["image_url"], "https://img.example.com/player-one.jpg")
        self.assertEqual(result[0]["team_image"], "https://img.example.com/team-a.png")
        self.assertEqual(result[0]["group"], "A")
        self.assertEqual(result[0]["statistics"]["clean_sheets"], 3)
        self.assertEqual(result[0]["statistics"]["saves"], 4)
        self.assertEqual(result[1]["statistics"]["rating"], 7.7)
        db.query.assert_called_once()
        query_args = db.query.call_args.args
        self.assertGreaterEqual(len(query_args), 3)
        self.assertIs(query_args[0], Player)
        self.assertIs(query_args[1], Team.logo_url)
        self.assertIs(query_args[2], Team.group)
        self.assertEqual(len(fake_query.join_calls), 1)
        self.assertEqual(fake_query.limit_value, 12)
        self.assertIsNotNone(fake_query.order_by_args)
        self.assertIn("stats_json", str(fake_query.order_by_args[0]))
        self.assertIn("rating", str(fake_query.order_by_args[0]))
        self.assertTrue(fake_query.filter_args)
        self.assertIn("to_tsvector", str(fake_query.filter_args[0]))
        self.assertIn("plainto_tsquery", str(fake_query.filter_args[0]))
        self.assertIn("classification", str(fake_query.filter_args[1]))


if __name__ == "__main__":
    unittest.main()
