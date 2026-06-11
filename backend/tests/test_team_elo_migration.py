import importlib.util
from pathlib import Path
import unittest
from unittest.mock import Mock, patch

import sqlalchemy as sa


def load_migration_module():
    migration_path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "f4b7c8d9e0a1_add_team_elo_ratings.py"
    spec = importlib.util.spec_from_file_location("add_team_elo_ratings", migration_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class FakeInspector:
    def __init__(self, table_names, pk_constraint, columns):
        self._table_names = table_names
        self._pk_constraint = pk_constraint
        self._columns = columns

    def get_table_names(self):
        return self._table_names

    def get_pk_constraint(self, table_name):
        if table_name != "matches":
            raise AssertionError(f"Unexpected table requested: {table_name}")
        return self._pk_constraint

    def get_columns(self, table_name):
        if table_name != "matches":
            raise AssertionError(f"Unexpected table requested: {table_name}")
        return self._columns


class TestTeamEloMigration(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_ensure_matches_primary_key_repairs_missing_primary_key(self):
        inspector = FakeInspector(
            table_names=["matches"],
            pk_constraint={"constrained_columns": []},
            columns=[{"name": "id", "type": sa.Integer(), "nullable": True}],
        )
        fake_bind = Mock()
        fake_bind.execute.side_effect = [
            Mock(scalar_one=Mock(return_value=0)),
            Mock(scalar_one=Mock(return_value=0)),
        ]

        with patch.object(self.migration.sa, "inspect", return_value=inspector), patch.object(
            self.migration.op,
            "alter_column",
        ) as alter_column, patch.object(self.migration.op, "create_primary_key") as create_primary_key:
            self.migration._ensure_matches_primary_key(fake_bind)

        alter_column.assert_called_once()
        create_primary_key.assert_called_once_with("pk_matches", "matches", ["id"])

    def test_ensure_matches_primary_key_skips_when_already_present(self):
        inspector = FakeInspector(
            table_names=["matches"],
            pk_constraint={"constrained_columns": ["id"]},
            columns=[{"name": "id", "type": sa.Integer(), "nullable": False}],
        )
        fake_bind = Mock()

        with patch.object(self.migration.sa, "inspect", return_value=inspector), patch.object(
            self.migration.op,
            "alter_column",
        ) as alter_column, patch.object(self.migration.op, "create_primary_key") as create_primary_key:
            self.migration._ensure_matches_primary_key(fake_bind)

        alter_column.assert_not_called()
        create_primary_key.assert_not_called()


if __name__ == "__main__":
    unittest.main()
