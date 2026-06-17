import importlib.util
import logging
from pathlib import Path
import unittest
from unittest.mock import patch

import sqlalchemy as sa

logging.disable(logging.CRITICAL)


def load_migration_module():
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "alembic"
        / "versions"
        / "b2c4d6e8f0a1_add_matches_index_flags.py"
    )
    spec = importlib.util.spec_from_file_location("add_matches_index_flags", migration_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class FakeInspector:
    def __init__(self, table_names, columns, indexes):
        self._table_names = table_names
        self._columns = columns
        self._indexes = indexes

    def get_table_names(self):
        return self._table_names

    def get_columns(self, table_name):
        if table_name != "matches":
            raise AssertionError(f"Unexpected table requested: {table_name}")
        return self._columns

    def get_indexes(self, table_name):
        if table_name != "matches":
            raise AssertionError(f"Unexpected table requested: {table_name}")
        return self._indexes


class TestMatchesIndexFlagsMigration(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_upgrade_adds_missing_flags_and_indexes(self):
        inspector = FakeInspector(table_names=["matches"], columns=[], indexes=[])
        fake_bind = object()

        with patch.object(self.migration.op, "get_bind", return_value=fake_bind), patch.object(
            self.migration.sa,
            "inspect",
            return_value=inspector,
        ), patch.object(self.migration.op, "add_column") as add_column, patch.object(
            self.migration.op,
            "create_index",
        ) as create_index:
            self.migration.upgrade()

        self.assertEqual(add_column.call_count, 2)
        self.assertEqual(create_index.call_count, 2)

    def test_upgrade_skips_existing_flags_and_indexes(self):
        inspector = FakeInspector(
            table_names=["matches"],
            columns=[
                {"name": "matchday_stats_indexed", "type": sa.Boolean(), "nullable": False},
                {"name": "player_stats_indexed", "type": sa.Boolean(), "nullable": False},
            ],
            indexes=[
                {"name": "ix_matches_matchday_stats_indexed"},
                {"name": "ix_matches_player_stats_indexed"},
            ],
        )
        fake_bind = object()

        with patch.object(self.migration.op, "get_bind", return_value=fake_bind), patch.object(
            self.migration.sa,
            "inspect",
            return_value=inspector,
        ), patch.object(self.migration.op, "add_column") as add_column, patch.object(
            self.migration.op,
            "create_index",
        ) as create_index:
            self.migration.upgrade()

        add_column.assert_not_called()
        create_index.assert_not_called()


if __name__ == "__main__":
    unittest.main()
