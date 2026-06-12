import json
import importlib.util
from pathlib import Path
import unittest

from alembic.config import Config
from alembic.script import ScriptDirectory
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from db.models.matchday_stats import MATCHDAY_STATS_STATISTICS_FIELDS, MatchdayStats
from db.models.matches import Match, MatchStatus
from pipeline.transformations.matchday_stats import MatchdayStatsTransformations


def load_migration_module():
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "alembic"
        / "versions"
        / "b1d0a7c5e9f2_match_status_enum_and_matchday_stats_constraints.py"
    )
    spec = importlib.util.spec_from_file_location("match_status_enum_and_matchday_stats_constraints", migration_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class FakeInspector:
    def __init__(self, table_names, columns, pk_constraints, foreign_keys, indexes=None, unique_constraints=None, enums=None):
        self._table_names = table_names
        self._columns = columns
        self._pk_constraints = pk_constraints
        self._foreign_keys = foreign_keys
        self._indexes = indexes or {}
        self._unique_constraints = unique_constraints or {}
        self._enums = enums or []

    def get_table_names(self):
        return self._table_names

    def get_columns(self, table_name):
        return self._columns.get(table_name, [])

    def get_pk_constraint(self, table_name):
        return self._pk_constraints.get(table_name, {})

    def get_foreign_keys(self, table_name):
        return self._foreign_keys.get(table_name, [])

    def get_indexes(self, table_name):
        return self._indexes.get(table_name, [])

    def get_unique_constraints(self, table_name):
        return self._unique_constraints.get(table_name, [])

    def get_enums(self):
        return self._enums


class TestMatchdayStatsSchema(unittest.TestCase):
    def setUp(self):
        self.migration = load_migration_module()

    def test_matchday_stats_model_metadata_matches_expected_schema(self):
        self.assertEqual(MatchdayStats.__tablename__, "matchday_stats")
        self.assertEqual(list(MatchdayStats.__table__.primary_key.columns.keys()), ["id"])

        column_names = list(MatchdayStats.__table__.columns.keys())
        self.assertEqual(column_names, ["id", "player_id", "match_id", "match_date", "statistics"])

        self.assertIsInstance(MatchdayStats.__table__.c.id.type, sa.BigInteger)
        self.assertIsInstance(MatchdayStats.__table__.c.player_id.type, sa.BigInteger)
        self.assertIsInstance(MatchdayStats.__table__.c.match_id.type, sa.BigInteger)
        self.assertIsInstance(MatchdayStats.__table__.c.match_date.type, sa.DateTime)
        self.assertIsInstance(MatchdayStats.__table__.c.statistics.type, postgresql.JSONB)
        self.assertIn("players.id", {str(fk.column) for fk in MatchdayStats.__table__.c.player_id.foreign_keys})
        self.assertIn("matches.sofascore_id", {str(fk.column) for fk in MatchdayStats.__table__.c.match_id.foreign_keys})
        parsed_default = self.migration._parse_jsonb_default_expression(MatchdayStats.__table__.c.statistics.server_default.arg)
        self.assertEqual(parsed_default, MatchdayStats.DEFAULT_STATISTICS)
        self.assertEqual(tuple(MatchdayStats.DEFAULT_STATISTICS.keys()), MATCHDAY_STATS_STATISTICS_FIELDS)
        docstring = MatchdayStatsTransformations.transform_matchday_stats.__doc__ or ""
        self.assertIn('"statistics": {', docstring)
        self.assertIn('"totalPass": 16', docstring)
        self.assertIn('"accuratePass": 13', docstring)

        self.assertEqual({member.value for member in MatchStatus}, {"scheduled", "live", "completed"})
        self.assertEqual(Match.__table__.c.status.type.enums, ["scheduled", "live", "completed"])
        self.assertTrue(Match.__table__.c.sofascore_id.unique)

        index_names = {index.name for index in MatchdayStats.__table__.indexes}
        self.assertIn("ix_matchday_stats_player_id", index_names)
        self.assertIn("ix_matchday_stats_match_date", index_names)
        self.assertIn("ix_matchday_stats_match_id", index_names)
        self.assertIn("ix_matchday_stats_statistics_rating", index_names)
        self.assertIn("ix_matchday_stats_statistics_goal_contributions", index_names)
        self.assertIn("ix_matchday_stats_statistics_pass_accuracy", index_names)

        self.assertIsInstance(Match.__table__.c.sofascore_id.type, sa.BigInteger)
        self.assertTrue(Match.__table__.c.sofascore_id.nullable)

    def test_matchday_feature_schema_report_detects_missing_table_and_missing_match_column(self):
        inspector = FakeInspector(
            table_names=["matches"],
            columns={
                "matches": [
                    {"name": "id", "type": sa.Integer()},
                    {"name": "round", "type": sa.String()},
                    {"name": "group", "type": sa.String()},
                    {"name": "home_team_code", "type": sa.String()},
                    {"name": "away_team_code", "type": sa.String()},
                    {"name": "status", "type": sa.String()},
                ]
            },
            pk_constraints={
                "matches": {"constrained_columns": ["id"]},
            },
            foreign_keys={
                "matches": [],
            },
            indexes={
                "matches": [],
            },
            unique_constraints={
                "matches": [],
            },
            enums=[],
        )

        report = self.migration._matchday_feature_schema_report(inspector)

        self.assertFalse(report["matchday_stats_table_exists"])
        self.assertIn("sofascore_id", report["missing_match_columns"])
        self.assertFalse(report["match_status_enum_exists"])

    def test_verify_matchday_feature_schema_passes_for_expected_schema(self):
        inspector = FakeInspector(
            table_names=["matches", "matchday_stats"],
            columns={
                "matches": [
                    {"name": "id", "type": sa.Integer()},
                    {"name": "round", "type": sa.String()},
                    {"name": "group", "type": sa.String()},
                    {"name": "home_team_code", "type": sa.String()},
                    {"name": "away_team_code", "type": sa.String()},
                    {"name": "stadium", "type": sa.String()},
                    {"name": "kickoff_utc", "type": sa.DateTime()},
                    {"name": "status", "type": postgresql.ENUM("scheduled", "live", "completed", name="match_status")},
                    {"name": "phase", "type": sa.String()},
                    {"name": "home_score", "type": sa.Integer()},
                    {"name": "away_score", "type": sa.Integer()},
                    {"name": "home_pen", "type": sa.Integer()},
                    {"name": "away_pen", "type": sa.Integer()},
                    {"name": "sofascore_id", "type": sa.BigInteger()},
                ],
                "matchday_stats": [
                    {"name": "id", "type": sa.BigInteger(), "default": "nextval('matchday_stats_id_seq'::regclass)"},
                    {"name": "player_id", "type": sa.BigInteger()},
                    {"name": "match_id", "type": sa.BigInteger()},
                    {"name": "match_date", "type": sa.DateTime()},
                    {
                        "name": "statistics",
                        "type": postgresql.JSONB(astext_type=sa.Text()),
                        "default": "'" + json.dumps(MatchdayStats.DEFAULT_STATISTICS) + "'::jsonb",
                    },
                ],
            },
            pk_constraints={
                "matches": {"constrained_columns": ["id"]},
                "matchday_stats": {"constrained_columns": ["id"]},
            },
            foreign_keys={
                "matches": [],
                "matchday_stats": [
                    {"name": "fk_matchday_stats_player_id_players", "constrained_columns": ["player_id"]},
                    {"name": "fk_matchday_stats_match_id_matches_sofascore_id", "constrained_columns": ["match_id"]},
                ],
            },
            indexes={
                "matches": [],
                "matchday_stats": [
                    {"name": "ix_matchday_stats_player_id", "column_names": ["player_id"]},
                    {"name": "ix_matchday_stats_match_date", "column_names": ["match_date"]},
                    {"name": "ix_matchday_stats_match_id", "column_names": ["match_id"]},
                    {"name": "ix_matchday_stats_statistics_rating", "column_names": []},
                    {"name": "ix_matchday_stats_statistics_goal_contributions", "column_names": []},
                    {"name": "ix_matchday_stats_statistics_pass_accuracy", "column_names": []},
                ],
            },
            unique_constraints={
                "matches": [
                    {"name": "uq_matches_sofascore_id", "column_names": ["sofascore_id"]},
                ],
            },
            enums=[{"name": "match_status"}],
        )

        original_inspect = self.migration.sa.inspect
        self.migration.sa.inspect = lambda bind: inspector
        try:
            self.migration.verify_matchday_feature_schema(object())
        finally:
            self.migration.sa.inspect = original_inspect

    def test_alembic_has_a_single_head_revision(self):
        config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
        script_directory = ScriptDirectory.from_config(config)

        heads = script_directory.get_heads()

        self.assertEqual(len(heads), 1)
        self.assertEqual(heads[0], "c5d6e7f8091a")


if __name__ == "__main__":
    unittest.main()
