import unittest
from unittest.mock import MagicMock

from db.controllers import players as players_controller


class FakeQuery:
    def __init__(self):
        self.order_by_args = None
        self.limit_value = None

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args):
        self.order_by_args = args
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def all(self):
        return ["row-1", "row-2"]


class TestPlayersTopQueries(unittest.TestCase):
    def test_get_top_players_by_goals_orders_by_stats_json_and_limits_to_five(self):
        fake_query = FakeQuery()
        db = MagicMock()
        db.query.return_value = fake_query

        result = players_controller.get_top_players_by_goals(db)

        self.assertEqual(result, ["row-1", "row-2"])
        self.assertEqual(fake_query.limit_value, 5)
        self.assertIsNotNone(fake_query.order_by_args)
        self.assertIn("stats_json", str(fake_query.order_by_args[0]))
        self.assertIn("goals", str(fake_query.order_by_args[0]))

    def test_get_top_players_by_assists_orders_by_stats_json_and_limits_to_five(self):
        fake_query = FakeQuery()
        db = MagicMock()
        db.query.return_value = fake_query

        result = players_controller.get_top_players_by_assists(db)

        self.assertEqual(result, ["row-1", "row-2"])
        self.assertEqual(fake_query.limit_value, 5)
        self.assertIsNotNone(fake_query.order_by_args)
        self.assertIn("stats_json", str(fake_query.order_by_args[0]))
        self.assertIn("assists", str(fake_query.order_by_args[0]))

    def test_get_top_players_by_rating_orders_by_stats_json_and_limits_to_five(self):
        fake_query = FakeQuery()
        db = MagicMock()
        db.query.return_value = fake_query

        result = players_controller.get_top_players_by_rating(db)

        self.assertEqual(result, ["row-1", "row-2"])
        self.assertEqual(fake_query.limit_value, 5)
        self.assertIsNotNone(fake_query.order_by_args)
        self.assertIn("stats_json", str(fake_query.order_by_args[0]))
        self.assertIn("rating", str(fake_query.order_by_args[0]))


if __name__ == "__main__":
    unittest.main()
