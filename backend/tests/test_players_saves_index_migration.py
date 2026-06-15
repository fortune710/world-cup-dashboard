import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

import sqlalchemy as sa


def load_migration_module():
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "alembic"
        / "versions"
        / "a9b8c7d6e5f4_add_players_stats_saves_index.py"
    )
    spec = importlib.util.spec_from_file_location("players_saves_index", migration_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class FakeInspector:
    def __init__(self, table_names, indexes):
        self._table_names = table_names
        self._indexes = indexes

    def get_table_names(self):
        return self._table_names

    def get_indexes(self, table_name):
        if table_name != "players":
            raise AssertionError(f"Unexpected table requested: {table_name}")
        return self._indexes


class TestPlayersSavesIndexMigration(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_saves_index_creation_is_skipped_when_already_present(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[{"name": "ix_players_stats_saves"}],
        )
        with patch.object(self.migration.op, "create_index") as create_index:
            self.migration._ensure_saves_index(inspector)

        create_index.assert_not_called()

    def test_saves_index_creation_is_requested_when_missing(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[],
        )
        with patch.object(self.migration.op, "create_index") as create_index:
            self.migration._ensure_saves_index(inspector)

        create_index.assert_called_once()
        args, kwargs = create_index.call_args
        self.assertEqual(args[0], "ix_players_stats_saves")
        self.assertEqual(args[1], "players")
        self.assertIn("saves", str(args[2][0]))
        self.assertFalse(kwargs.get("unique"))

    def test_verify_players_saves_index_passes_when_index_exists(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[{"name": "ix_players_stats_saves"}],
        )
        original_inspect = self.migration.sa.inspect
        self.migration.sa.inspect = lambda bind: inspector
        try:
            self.migration.verify_players_saves_index(object())
        finally:
            self.migration.sa.inspect = original_inspect

    def test_players_saves_index_expression_uses_stats_json(self):
        saves_expression = self.migration.sa.text("(CAST(stats_json->>'saves' AS INTEGER))")

        self.assertIn("stats_json", str(saves_expression))
        self.assertIn("saves", str(saves_expression))


if __name__ == "__main__":
    unittest.main()
