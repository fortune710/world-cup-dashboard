"""add player stats queue pending flag

Revision ID: f5a1b2c3d4e5
Revises: c5d6e7f8091a
Create Date: 2026-06-13 00:00:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f5a1b2c3d4e5"
down_revision = "c5d6e7f8091a"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

PLAYERS_TABLE_NAME = "players"
STATS_QUEUE_PENDING_COLUMN = "stats_queue_pending"
STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN = "stats_last_enqueued_batch_key"


def _column_type_matches(actual_type: sa.types.TypeEngine, expected_type: sa.types.TypeEngine) -> bool:
    logger.info(
        {
            "message": "Comparing players queue pending column type",
            "actual_type": str(actual_type),
            "expected_type": str(expected_type),
        }
    )
    return isinstance(actual_type, expected_type.__class__)


def _players_schema_report(inspector: sa.engine.reflection.Inspector) -> dict:
    logger.info({"message": "Building players queue pending schema report"})
    tables = inspector.get_table_names()
    if PLAYERS_TABLE_NAME not in tables:
        report = {
            "table_exists": False,
            "missing_columns": [STATS_QUEUE_PENDING_COLUMN, STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN],
            "mismatched_columns": {},
        }
        logger.info({"message": "Players queue pending schema report complete", "report": report})
        return report

    columns = {column["name"]: column for column in inspector.get_columns(PLAYERS_TABLE_NAME)}
    missing_columns = [
        column_name
        for column_name in (STATS_QUEUE_PENDING_COLUMN, STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN)
        if column_name not in columns
    ]
    mismatched_columns = {}
    if STATS_QUEUE_PENDING_COLUMN in columns:
        expected_type = sa.Boolean()
        if not _column_type_matches(columns[STATS_QUEUE_PENDING_COLUMN]["type"], expected_type):
            mismatched_columns[STATS_QUEUE_PENDING_COLUMN] = {
                "current_type": str(columns[STATS_QUEUE_PENDING_COLUMN]["type"]),
                "expected_type": str(expected_type),
            }
    if STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN in columns:
        expected_type = sa.String()
        if not _column_type_matches(columns[STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN]["type"], expected_type):
            mismatched_columns[STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN] = {
                "current_type": str(columns[STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN]["type"]),
                "expected_type": str(expected_type),
            }

    report = {
        "table_exists": True,
        "missing_columns": missing_columns,
        "mismatched_columns": mismatched_columns,
    }
    logger.info({"message": "Players queue pending schema report complete", "report": report})
    return report


def _ensure_stats_queue_pending_column(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping stats queue pending repair because players table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(PLAYERS_TABLE_NAME)}
    if STATS_QUEUE_PENDING_COLUMN not in columns:
        logger.warning({"message": "Adding missing stats queue pending column"})
        op.add_column(
            PLAYERS_TABLE_NAME,
            sa.Column(
                STATS_QUEUE_PENDING_COLUMN,
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )
        logger.info({"message": "Added stats queue pending column"})
    elif not (_column_type_matches(columns[STATS_QUEUE_PENDING_COLUMN]["type"], sa.Boolean()) and not columns[STATS_QUEUE_PENDING_COLUMN].get("nullable", True)):
        current_type = columns[STATS_QUEUE_PENDING_COLUMN]["type"]
        nullable = columns[STATS_QUEUE_PENDING_COLUMN].get("nullable", True)
        logger.warning(
            {
                "message": "Repairing stats queue pending column",
                "current_type": str(current_type),
                "nullable": nullable,
            }
        )
        op.execute(sa.text(f"UPDATE {PLAYERS_TABLE_NAME} SET {STATS_QUEUE_PENDING_COLUMN} = false WHERE {STATS_QUEUE_PENDING_COLUMN} IS NULL"))
        op.alter_column(
            PLAYERS_TABLE_NAME,
            STATS_QUEUE_PENDING_COLUMN,
            existing_type=current_type,
            type_=sa.Boolean(),
            existing_nullable=nullable,
            nullable=False,
            server_default=sa.text("false"),
        )
        logger.info({"message": "Stats queue pending column repaired"})

    if STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN not in columns:
        logger.warning({"message": "Adding missing stats last enqueued batch key column"})
        op.add_column(
            PLAYERS_TABLE_NAME,
            sa.Column(STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN, sa.String(), nullable=True),
        )
        logger.info({"message": "Added stats last enqueued batch key column"})
    elif not _column_type_matches(columns[STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN]["type"], sa.String()):
        current_type = columns[STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN]["type"]
        logger.warning(
            {
                "message": "Repairing stats last enqueued batch key column",
                "current_type": str(current_type),
            }
        )
        op.alter_column(
            PLAYERS_TABLE_NAME,
            STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN,
            existing_type=current_type,
            type_=sa.String(),
            existing_nullable=columns[STATS_LAST_ENQUEUED_BATCH_KEY_COLUMN].get("nullable", True),
        )
        logger.info({"message": "Stats last enqueued batch key column repaired"})


def verify_players_schema(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Verifying players queue pending schema after repair"})
    report = _players_schema_report(sa.inspect(bind))
    if report["table_exists"] and not report["missing_columns"] and not report["mismatched_columns"]:
        logger.info({"message": "Players queue pending schema verification passed"})
        return

    logger.error({"message": "Players queue pending schema verification failed", "report": report})
    raise RuntimeError(f"Players queue pending schema verification failed: {report}")


def upgrade() -> None:
    bind = op.get_bind()
    logger.info({"message": "Starting players queue pending migration"})
    _ensure_stats_queue_pending_column(bind)
    verify_players_schema(bind)
    logger.info({"message": "Completed players queue pending migration"})


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting players queue pending downgrade"})

    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Players table missing during queue pending downgrade; nothing to do"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(PLAYERS_TABLE_NAME)}
    if STATS_QUEUE_PENDING_COLUMN not in columns:
        logger.info({"message": "Players queue pending column already absent during downgrade"})
        return

    logger.warning({"message": "Dropping stats queue pending column"})
    op.drop_column(PLAYERS_TABLE_NAME, STATS_QUEUE_PENDING_COLUMN)
    logger.info({"message": "Completed players queue pending downgrade"})
