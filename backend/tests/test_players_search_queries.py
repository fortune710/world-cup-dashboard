import unittest
import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)

from db.controllers import players as players_controller
from db.models.players import Player, PlayerClassification


class FakeSearchQuery:
    def __init__(self, rows):
        logger.info("Initializing FakeSearchQuery")
        self.rows = rows
        self.filter_args = []
        self.order_by_args = None
        self.limit_value = None

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


class TestPlayerSearchQueries(unittest.TestCase):
    def test_search_players_by_name_builds_fuzzy_payload_without_rating(self):
        fake_query = FakeSearchQuery(
            [
                SimpleNamespace(
                    id=10,
                    name="Lionel Messi",
                    country_code="ARG",
                    positions="RW, ST",
                    classification=PlayerClassification.F,
                )
            ]
        )
        db = MagicMock()
        db.query.return_value = fake_query

        result = players_controller.search_players_by_name(db, query="Messi", limit=5)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], 10)
        self.assertEqual(result[0]["name"], "Lionel Messi")
        self.assertEqual(result[0]["country_code"], "ARG")
        self.assertEqual(result[0]["position"], "RW")
        self.assertEqual(result[0]["image_url"], "/players/10/image")
        self.assertNotIn("rating", result[0])
        db.query.assert_called_once_with(Player)
        self.assertEqual(fake_query.limit_value, 5)
        self.assertTrue(fake_query.filter_args)
        filter_sql = str(fake_query.filter_args[0])
        self.assertIn("similarity", filter_sql)
        self.assertIn("to_tsvector", filter_sql)
        self.assertIn("plainto_tsquery", filter_sql)

    def test_search_players_by_name_returns_empty_list_for_blank_query(self):
        db = MagicMock()
        result = players_controller.search_players_by_name(db, query="   ", limit=5)

        self.assertEqual(result, [])
        db.query.assert_not_called()


if __name__ == "__main__":
    unittest.main()
