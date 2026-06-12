"""repair matches schema

Revision ID: c5d6e7f8091a
Revises: d9f8e7c6b5a4
Create Date: 2026-06-12 00:00:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c5d6e7f8091a"
down_revision = "d9f8e7c6b5a4"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

MATCHES_TABLE_NAME = "matches"

EXPECTED_MATCH_COLUMNS = {
    "kickoff_utc": {"type": sa.DateTime(), "nullable": True},
    "home_score": {"type": sa.Integer(), "nullable": True},
    "away_score": {"type": sa.Integer(), "nullable": True},
}


def _column_type_matches(actual_type: sa.types.TypeEngine, expected_type: sa.types.TypeEngine) -> bool:
    logger.info(
        {
            "message": "Comparing matches column type",
            "actual_type": str(actual_type),
            "expected_type": str(expected_type),
        }
    )

    if isinstance(expected_type, sa.DateTime):
        return isinstance(actual_type, sa.DateTime)

    if isinstance(expected_type, sa.Integer):
        return isinstance(actual_type, sa.Integer)

    return isinstance(actual_type, expected_type.__class__)


def _safe_timestamp_using(column_name: str) -> str:
    logger.info({"message": "Building safe timestamp cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::timestamp without time zone"


def _safe_integer_using(column_name: str) -> str:
    logger.info({"message": "Building safe integer cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::integer"


def _matches_schema_report(inspector: sa.engine.reflection.Inspector) -> dict:
    logger.info({"message": "Building matches schema report"})
    tables = inspector.get_table_names()

    missing_match_columns = list(EXPECTED_MATCH_COLUMNS.keys())
    mismatched_match_columns = {}
    if MATCHES_TABLE_NAME in tables:
        match_columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
        missing_match_columns = [column_name for column_name in EXPECTED_MATCH_COLUMNS if column_name not in match_columns]
        for column_name, spec in EXPECTED_MATCH_COLUMNS.items():
            if column_name not in match_columns:
                continue
            if not _column_type_matches(match_columns[column_name]["type"], spec["type"]):
                mismatched_match_columns[column_name] = {
                    "current_type": str(match_columns[column_name]["type"]),
                    "expected_type": str(spec["type"]),
                }

    report = {
        "matches_table_exists": MATCHES_TABLE_NAME in tables,
        "missing_match_columns": missing_match_columns,
        "mismatched_match_columns": mismatched_match_columns,
    }
    logger.info({"message": "Matches schema report complete", "report": report})
    return report


def _ensure_matches_column_types(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHES_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matches column repair because table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
    for column_name, spec in EXPECTED_MATCH_COLUMNS.items():
        if column_name not in columns:
            logger.warning({"message": "Matches column missing during repair", "column_name": column_name})
            op.add_column(
                MATCHES_TABLE_NAME,
                sa.Column(column_name, spec["type"], nullable=spec["nullable"]),
            )
            continue

        current_type = columns[column_name]["type"]
        if _column_type_matches(current_type, spec["type"]):
            logger.info(
                {
                    "message": "Matches column type already matches",
                    "column_name": column_name,
                    "current_type": str(current_type),
                }
            )
            continue

        logger.warning(
            {
                "message": "Repairing matches column type",
                "column_name": column_name,
                "current_type": str(current_type),
                "expected_type": str(spec["type"]),
            }
        )
        alter_kwargs = {
            "existing_type": current_type,
            "type_": spec["type"],
        }
        if "nullable" in columns[column_name]:
            alter_kwargs["existing_nullable"] = columns[column_name]["nullable"]
        if column_name == "kickoff_utc":
            alter_kwargs["postgresql_using"] = _safe_timestamp_using(column_name)
        else:
            alter_kwargs["postgresql_using"] = _safe_integer_using(column_name)
        op.alter_column(MATCHES_TABLE_NAME, column_name, **alter_kwargs)

    logger.info({"message": "Matches column repair complete"})


def verify_matches_schema(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Verifying matches schema after repair"})
    report = _matches_schema_report(sa.inspect(bind))
    if report["matches_table_exists"] and not report["missing_match_columns"] and not report["mismatched_match_columns"]:
        logger.info({"message": "Matches schema verification passed"})
        return

    logger.error({"message": "Matches schema verification failed", "report": report})
    raise RuntimeError(f"Matches schema verification failed: {report}")


def upgrade() -> None:
    bind = op.get_bind()
    logger.info({"message": "Starting matches schema repair migration"})
    _ensure_matches_column_types(bind)
    verify_matches_schema(bind)
    logger.info({"message": "Completed matches schema repair migration"})


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting matches schema downgrade"})

    if MATCHES_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Matches table missing during downgrade; nothing to do"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
    downgrade_specs = {
        "away_score": {"type": sa.String(), "using": "away_score::text"},
        "home_score": {"type": sa.String(), "using": "home_score::text"},
        "kickoff_utc": {"type": sa.String(), "using": "kickoff_utc::text"},
    }

    for column_name, spec in downgrade_specs.items():
        if column_name not in columns:
            continue
        current_type = columns[column_name]["type"]
        if _column_type_matches(current_type, spec["type"]):
            continue

        logger.warning(
            {
                "message": "Reverting matches column type during downgrade",
                "column_name": column_name,
                "current_type": str(current_type),
                "target_type": str(spec["type"]),
            }
        )
        op.alter_column(
            MATCHES_TABLE_NAME,
            column_name,
            existing_type=current_type,
            type_=spec["type"],
            existing_nullable=columns[column_name].get("nullable", True),
            postgresql_using=spec["using"],
        )

    logger.info({"message": "Completed matches schema downgrade"})
