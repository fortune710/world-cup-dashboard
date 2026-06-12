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
        / "c5d6e7f8091a_repair_matches_schema.py"
    )
    spec = importlib.util.spec_from_file_location("repair_matches_schema", migration_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class FakeInspector:
    def __init__(self, table_names, columns):
        self._table_names = table_names
        self._columns = columns

    def get_table_names(self):
        return self._table_names

    def get_columns(self, table_name):
        if table_name != "matches":
            raise AssertionError(f"Unexpected table requested: {table_name}")
        return self._columns


class TestMatchesSchemaMigration(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_matches_schema_report_detects_string_column_types(self):
        inspector = FakeInspector(
            table_names=["matches"],
            columns=[
                {"name": "kickoff_utc", "type": sa.String()},
                {"name": "home_score", "type": sa.String()},
                {"name": "away_score", "type": sa.String()},
            ],
        )

        report = self.migration._matches_schema_report(inspector)

        self.assertTrue(report["matches_table_exists"])
        self.assertEqual(report["missing_match_columns"], [])
        self.assertIn("kickoff_utc", report["mismatched_match_columns"])
        self.assertIn("home_score", report["mismatched_match_columns"])
        self.assertIn("away_score", report["mismatched_match_columns"])

    def test_ensure_matches_column_types_repairs_string_column_types(self):
        inspector = FakeInspector(
            table_names=["matches"],
            columns=[
                {"name": "kickoff_utc", "type": sa.String(), "nullable": True},
                {"name": "home_score", "type": sa.String(), "nullable": True},
                {"name": "away_score", "type": sa.String(), "nullable": True},
            ],
        )
        fake_bind = object()

        with patch.object(self.migration.sa, "inspect", return_value=inspector), patch.object(
            self.migration.op,
            "alter_column",
        ) as alter_column:
            self.migration._ensure_matches_column_types(fake_bind)

        self.assertEqual(alter_column.call_count, 3)
        called_columns = {call.args[1] for call in alter_column.call_args_list}
        self.assertEqual(called_columns, {"kickoff_utc", "home_score", "away_score"})


if __name__ == "__main__":
    unittest.main()
