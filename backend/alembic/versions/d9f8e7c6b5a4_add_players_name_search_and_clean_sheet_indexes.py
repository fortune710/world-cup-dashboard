"""add players name search and clean sheet indexes

Revision ID: d9f8e7c6b5a4
Revises: 6c2d7f8a9b1e
Create Date: 2026-06-11 03:00:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d9f8e7c6b5a4"
down_revision = "6c2d7f8a9b1e"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

PLAYERS_TABLE_NAME = "players"
CLEAN_SHEET_INDEX_NAME = "ix_players_stats_clean_sheet"
NAME_SEARCH_INDEX_NAME = "ix_players_name_search"


def _players_index_names(inspector: sa.engine.reflection.Inspector) -> set[str]:
    logger.info({"message": "Collecting players indexes", "table_name": PLAYERS_TABLE_NAME})
    index_names = {index["name"] for index in inspector.get_indexes(PLAYERS_TABLE_NAME)}
    logger.info(
        {
            "message": "Collected players indexes",
            "table_name": PLAYERS_TABLE_NAME,
            "count": len(index_names),
        }
    )
    return index_names


def _ensure_clean_sheet_index(bind: sa.engine.Connection, inspector: sa.engine.reflection.Inspector) -> None:
    index_names = _players_index_names(inspector)
    if CLEAN_SHEET_INDEX_NAME in index_names:
        logger.info(
            {
                "message": "Players clean sheet index already present",
                "index_name": CLEAN_SHEET_INDEX_NAME,
            }
        )
        return

    logger.info(
        {
            "message": "Creating players clean sheet index",
            "index_name": CLEAN_SHEET_INDEX_NAME,
        }
    )
    op.create_index(
        CLEAN_SHEET_INDEX_NAME,
        PLAYERS_TABLE_NAME,
        [sa.text("(CAST(stats_json->>'clean_sheet' AS INTEGER))")],
        unique=False,
    )


def _ensure_name_search_index(bind: sa.engine.Connection, inspector: sa.engine.reflection.Inspector) -> None:
    index_names = _players_index_names(inspector)
    if NAME_SEARCH_INDEX_NAME in index_names:
        logger.info(
            {
                "message": "Players name search index already present",
                "index_name": NAME_SEARCH_INDEX_NAME,
            }
        )
        return

    logger.info(
        {
            "message": "Creating players name search index",
            "index_name": NAME_SEARCH_INDEX_NAME,
        }
    )
    op.create_index(
        NAME_SEARCH_INDEX_NAME,
        PLAYERS_TABLE_NAME,
        [sa.text("to_tsvector('english', name)")],
        unique=False,
        postgresql_using="gin",
    )


def verify_players_search_indexes(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    index_names = _players_index_names(inspector)
    missing_indexes = [
        index_name
        for index_name in (CLEAN_SHEET_INDEX_NAME, NAME_SEARCH_INDEX_NAME)
        if index_name not in index_names
    ]
    if missing_indexes:
        logger.error(
            {
                "message": "Players search indexes verification failed",
                "missing_indexes": missing_indexes,
            }
        )
        raise RuntimeError(f"Missing players indexes: {', '.join(missing_indexes)}")

    logger.info(
        {
            "message": "Players search indexes verified",
            "indexes": sorted(index_names),
        }
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting players search index migration"})
    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.warning(
            {
                "message": "Players table missing; skipping players search index migration",
                "table_name": PLAYERS_TABLE_NAME,
            }
        )
        return

    _ensure_clean_sheet_index(bind, inspector)
    _ensure_name_search_index(bind, inspector)
    verify_players_search_indexes(bind)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Reverting players search index migration"})
    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.warning(
            {
                "message": "Players table missing; skipping players search index downgrade",
                "table_name": PLAYERS_TABLE_NAME,
            }
        )
        return

    index_names = _players_index_names(inspector)
    if NAME_SEARCH_INDEX_NAME in index_names:
        op.drop_index(NAME_SEARCH_INDEX_NAME, table_name=PLAYERS_TABLE_NAME)
    if CLEAN_SHEET_INDEX_NAME in index_names:
        op.drop_index(CLEAN_SHEET_INDEX_NAME, table_name=PLAYERS_TABLE_NAME)
