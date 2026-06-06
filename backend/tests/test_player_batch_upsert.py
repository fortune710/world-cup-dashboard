import unittest
from unittest.mock import Mock

from sqlalchemy.exc import ProgrammingError

from db.models.players import upsert_players_batch


class TestPlayerBatchUpsert(unittest.TestCase):
    def test_falls_back_when_conflict_target_is_missing(self):
        players = [
            {"id": 915991, "name": "Abdullah Al-Hamdan"},
            {"id": 893307, "name": "Firas Al-Buraikan"},
        ]
        db = Mock()
        db.execute.side_effect = ProgrammingError(
            "INSERT INTO players ... ON CONFLICT (id)",
            {},
            Exception(
                "there is no unique or exclusion constraint matching the ON CONFLICT specification"
            ),
        )

        row_count = upsert_players_batch(db, players)

        self.assertEqual(row_count, 2)
        self.assertEqual(db.execute.call_count, 1)
        self.assertEqual(db.merge.call_count, 2)
        db.commit.assert_called_once()
        self.assertEqual(db.rollback.call_count, 1)


if __name__ == "__main__":
    unittest.main()
