import importlib.util
from pathlib import Path
import unittest

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def load_migration_module():
    migration_path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "4c6d8f2a91b7_repair_players_schema.py"
    spec = importlib.util.spec_from_file_location("repair_players_schema", migration_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class FakeInspector:
    def __init__(self, table_names, columns, pk_constraint, foreign_keys):
        self._table_names = table_names
        self._columns = columns
        self._pk_constraint = pk_constraint
        self._foreign_keys = foreign_keys

    def get_table_names(self):
        return self._table_names

    def get_columns(self, table_name):
        self.assert_table(table_name)
        return self._columns

    def get_pk_constraint(self, table_name):
        self.assert_table(table_name)
        return self._pk_constraint

    def get_foreign_keys(self, table_name):
        self.assert_table(table_name)
        return self._foreign_keys

    @staticmethod
    def assert_table(table_name):
        if table_name != "players":
            raise AssertionError(f"Unexpected table requested: {table_name}")


class TestPlayersSchemaMigration(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_column_type_matches_detects_length_mismatch(self):
        self.assertTrue(
            self.migration._column_type_matches(sa.String(length=3), sa.String(length=3))
        )
        self.assertFalse(
            self.migration._column_type_matches(sa.String(length=10), sa.String(length=3))
        )
        self.assertTrue(
            self.migration._column_type_matches(
                postgresql.JSONB(astext_type=sa.Text()),
                postgresql.JSONB(astext_type=sa.Text()),
            )
        )

    def test_enum_using_expression_nullifies_invalid_values(self):
        expression = self.migration._enum_using_expression(
            "foot",
            "playerfoot",
            ("Left", "Right", "Both"),
        )

        self.assertIn("CASE WHEN", expression)
        self.assertIn("btrim(foot::text)", expression)
        self.assertIn("::playerfoot", expression)
        self.assertIn("ELSE NULL END", expression)

    def test_players_schema_report_detects_missing_primary_key_and_bad_types(self):
        inspector = FakeInspector(
            table_names=["players"],
            columns=[
                {"name": "id", "type": sa.String()},
                {"name": "country_code", "type": sa.String(length=10)},
                {"name": "rating", "type": sa.String()},
                {"name": "height_cm", "type": sa.String()},
                {"name": "weight_kg", "type": sa.String()},
                {"name": "market_value", "type": sa.String()},
                {"name": "date_of_birth", "type": sa.String()},
                {"name": "classification", "type": sa.String()},
                {"name": "foot", "type": sa.String()},
                {"name": "stats_json", "type": sa.String()},
                {"name": "name", "type": sa.String()},
                {"name": "club_name", "type": sa.String()},
                {"name": "positions", "type": sa.String()},
                {"name": "image_url", "type": sa.String()},
            ],
            pk_constraint={"constrained_columns": []},
            foreign_keys=[],
        )

        report = self.migration._players_schema_report(inspector)

        self.assertTrue(report["table_exists"])
        self.assertEqual(report["primary_key"], [])
        self.assertFalse(report["foreign_keys_ok"])
        self.assertIn("id", report["mismatched_columns"])
        self.assertIn("rating", report["mismatched_columns"])
        self.assertIn("country_code", report["mismatched_columns"])

    def test_verify_players_schema_passes_for_expected_schema(self):
        inspector = FakeInspector(
            table_names=["players"],
            columns=[
                {"name": "id", "type": sa.BigInteger()},
                {"name": "name", "type": sa.String()},
                {"name": "date_of_birth", "type": sa.Date()},
                {"name": "classification", "type": sa.Enum("G", "D", "M", "F", name="playerclassification")},
                {"name": "club_name", "type": sa.String()},
                {"name": "positions", "type": sa.String()},
                {"name": "weight_kg", "type": sa.SmallInteger()},
                {"name": "height_cm", "type": sa.SmallInteger()},
                {"name": "foot", "type": sa.Enum("Left", "Right", "Both", name="playerfoot")},
                {"name": "country_code", "type": sa.String(length=3)},
                {"name": "market_value", "type": sa.BigInteger()},
                {"name": "image_url", "type": sa.String()},
                {"name": "rating", "type": sa.Float()},
                {"name": "stats_json", "type": postgresql.JSONB(astext_type=sa.Text())},
            ],
            pk_constraint={"constrained_columns": ["id"]},
            foreign_keys=[
                {
                    "constrained_columns": ["country_code"],
                    "referred_table": "teams",
                    "referred_columns": ["code"],
                }
            ],
        )

        original_inspect = self.migration.sa.inspect
        self.migration.sa.inspect = lambda bind: inspector
        try:
            self.migration.verify_players_schema(object())
        finally:
            self.migration.sa.inspect = original_inspect


if __name__ == "__main__":
    unittest.main()
