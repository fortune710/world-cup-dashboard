"""add match indexing flags

Revision ID: b2c4d6e8f0a1
Revises: a9b8c7d6e5f4
Create Date: 2026-06-16 00:00:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b2c4d6e8f0a1"
down_revision = "a9b8c7d6e5f4"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

MATCHES_TABLE_NAME = "matches"
MATCHDAY_STATS_INDEXED_COLUMN = "matchday_stats_indexed"
PLAYER_STATS_INDEXED_COLUMN = "player_stats_indexed"
MATCHDAY_STATS_INDEX_NAME = "ix_matches_matchday_stats_indexed"
PLAYER_STATS_INDEX_NAME = "ix_matches_player_stats_indexed"

EXPECTED_MATCH_COLUMNS = {
    MATCHDAY_STATS_INDEXED_COLUMN: {"type": sa.Boolean(), "nullable": False},
    PLAYER_STATS_INDEXED_COLUMN: {"type": sa.Boolean(), "nullable": False},
}


def _column_type_matches(actual_type: sa.types.TypeEngine, expected_type: sa.types.TypeEngine) -> bool:
    logger.info(
        {
            "message": "Comparing matches indexing column type",
            "actual_type": str(actual_type),
            "expected_type": str(expected_type),
        }
    )
    return isinstance(actual_type, expected_type.__class__)


def _ensure_matches_index_flags(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Ensuring matches indexing flags"})
    inspector = sa.inspect(bind)
    if MATCHES_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matches indexing flag repair because table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
    indexes = {index["name"] for index in inspector.get_indexes(MATCHES_TABLE_NAME)}

    for column_name, spec in EXPECTED_MATCH_COLUMNS.items():
        if column_name not in columns:
            logger.warning(
                {
                    "message": "Adding missing matches indexing flag column",
                    "column_name": column_name,
                }
            )
            op.add_column(
                MATCHES_TABLE_NAME,
                sa.Column(
                    column_name,
                    spec["type"],
                    nullable=spec["nullable"],
                    server_default=sa.text("false"),
                ),
            )
            logger.info({"message": "Added matches indexing flag column", "column_name": column_name})
            continue

        current_type = columns[column_name]["type"]
        current_nullable = columns[column_name].get("nullable", True)
        if _column_type_matches(current_type, spec["type"]) and current_nullable is False:
            logger.info(
                {
                    "message": "Matches indexing flag column already matches",
                    "column_name": column_name,
                    "current_type": str(current_type),
                }
            )
            continue

        logger.warning(
            {
                "message": "Repairing matches indexing flag column",
                "column_name": column_name,
                "current_type": str(current_type),
                "nullable": current_nullable,
            }
        )
        op.execute(sa.text(f"UPDATE {MATCHES_TABLE_NAME} SET {column_name} = false WHERE {column_name} IS NULL"))
        op.alter_column(
            MATCHES_TABLE_NAME,
            column_name,
            existing_type=current_type,
            type_=sa.Boolean(),
            existing_nullable=current_nullable,
            nullable=False,
            server_default=sa.text("false"),
        )

    expected_indexes = {
        MATCHDAY_STATS_INDEX_NAME: MATCHDAY_STATS_INDEXED_COLUMN,
        PLAYER_STATS_INDEX_NAME: PLAYER_STATS_INDEXED_COLUMN,
    }
    for index_name, column_name in expected_indexes.items():
        if index_name in indexes:
            logger.info(
                {
                    "message": "Matches indexing flag index already exists",
                    "index_name": index_name,
                    "column_name": column_name,
                }
            )
            continue

        logger.warning(
            {
                "message": "Creating matches indexing flag index",
                "index_name": index_name,
                "column_name": column_name,
            }
        )
        op.create_index(index_name, MATCHES_TABLE_NAME, [column_name], unique=False)
        logger.info(
            {
                "message": "Created matches indexing flag index",
                "index_name": index_name,
                "column_name": column_name,
            }
        )


def upgrade() -> None:
    bind = op.get_bind()
    logger.info({"message": "Starting matches indexing flags migration"})
    _ensure_matches_index_flags(bind)
    logger.info({"message": "Completed matches indexing flags migration"})


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting matches indexing flags downgrade"})

    if MATCHES_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Matches table missing during indexing flags downgrade; nothing to do"})
        return

    indexes = {index["name"] for index in inspector.get_indexes(MATCHES_TABLE_NAME)}
    for index_name in (PLAYER_STATS_INDEX_NAME, MATCHDAY_STATS_INDEX_NAME):
        if index_name not in indexes:
            logger.info({"message": "Matches indexing flag index already absent", "index_name": index_name})
            continue
        logger.warning({"message": "Dropping matches indexing flag index", "index_name": index_name})
        op.drop_index(index_name, table_name=MATCHES_TABLE_NAME)

    columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
    for column_name in (PLAYER_STATS_INDEXED_COLUMN, MATCHDAY_STATS_INDEXED_COLUMN):
        if column_name not in columns:
            logger.info({"message": "Matches indexing flag column already absent", "column_name": column_name})
            continue
        logger.warning({"message": "Dropping matches indexing flag column", "column_name": column_name})
        op.drop_column(MATCHES_TABLE_NAME, column_name)

    logger.info({"message": "Completed matches indexing flags downgrade"})
