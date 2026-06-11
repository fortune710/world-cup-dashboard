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
        / "d9f8e7c6b5a4_add_players_name_search_and_clean_sheet_indexes.py"
    )
    spec = importlib.util.spec_from_file_location("players_search_indexes", migration_path)
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


class TestPlayersSearchIndexMigration(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_clean_sheet_index_creation_is_skipped_when_already_present(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[{"name": "ix_players_stats_clean_sheet"}],
        )
        with patch.object(self.migration.op, "create_index") as create_index:
            self.migration._ensure_clean_sheet_index(object(), inspector)

        create_index.assert_not_called()

    def test_name_search_index_creation_is_requested_when_missing(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[{"name": "ix_players_stats_clean_sheet"}],
        )
        with patch.object(self.migration.op, "create_index") as create_index:
            self.migration._ensure_name_search_index(object(), inspector)

        create_index.assert_called_once()
        args, kwargs = create_index.call_args
        self.assertEqual(args[0], "ix_players_name_search")
        self.assertEqual(args[1], "players")
        self.assertIn("gin", str(kwargs))

    def test_verify_players_search_indexes_passes_when_both_indexes_exist(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[
                {"name": "ix_players_stats_clean_sheet"},
                {"name": "ix_players_name_search"},
            ],
        )
        original_inspect = self.migration.sa.inspect
        self.migration.sa.inspect = lambda bind: inspector
        try:
            self.migration.verify_players_search_indexes(object())
        finally:
            self.migration.sa.inspect = original_inspect

    def test_players_leaderboard_index_expressions_use_text_search_and_stats_json(self):
        clean_sheet_expression = self.migration.sa.text("(CAST(stats_json->>'clean_sheet' AS INTEGER))")
        name_search_expression = self.migration.sa.text("to_tsvector('english', name)")

        self.assertIn("clean_sheet", str(clean_sheet_expression))
        self.assertIn("to_tsvector", str(name_search_expression))


if __name__ == "__main__":
    unittest.main()
