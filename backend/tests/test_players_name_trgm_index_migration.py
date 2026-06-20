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
        / "c8e1f2a3b4c5_add_players_name_trgm_index.py"
    )
    spec = importlib.util.spec_from_file_location("players_name_trgm_index", migration_path)
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


class TestPlayersNameTrgmIndexMigration(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_name_trgm_index_creation_is_requested_when_missing(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[{"name": "ix_players_name_search"}],
        )
        with patch.object(self.migration.op, "create_index") as create_index:
            self.migration._ensure_name_trgm_index(object(), inspector)

        create_index.assert_called_once()
        args, kwargs = create_index.call_args
        self.assertEqual(args[0], "ix_players_name_trgm")
        self.assertEqual(args[1], "players")
        self.assertEqual(args[2], ["name"])
        self.assertEqual(kwargs.get("postgresql_using"), "gin")
        self.assertEqual(kwargs.get("postgresql_ops"), {"name": "gin_trgm_ops"})

    def test_name_trgm_index_creation_is_skipped_when_already_present(self):
        inspector = FakeInspector(
            table_names=["players"],
            indexes=[{"name": "ix_players_name_trgm"}],
        )
        with patch.object(self.migration.op, "create_index") as create_index:
            self.migration._ensure_name_trgm_index(object(), inspector)

        create_index.assert_not_called()

    def test_pg_trgm_extension_is_enabled(self):
        bind = sa.create_engine("sqlite://").connect()
        with patch.object(bind, "execute") as execute:
            self.migration._ensure_pg_trgm_extension(bind)

        execute.assert_called_once()
        sql_text = str(execute.call_args.args[0])
        self.assertIn("CREATE EXTENSION IF NOT EXISTS pg_trgm", sql_text)


if __name__ == "__main__":
    unittest.main()
