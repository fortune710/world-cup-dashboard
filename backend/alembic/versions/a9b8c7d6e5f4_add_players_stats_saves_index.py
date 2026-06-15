"""add players stats saves index

Revision ID: a9b8c7d6e5f4
Revises: f5a1b2c3d4e5
Create Date: 2026-06-14 00:00:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a9b8c7d6e5f4"
down_revision = "f5a1b2c3d4e5"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

PLAYERS_TABLE_NAME = "players"
SAVES_INDEX_NAME = "ix_players_stats_saves"


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


def _ensure_saves_index(inspector: sa.engine.reflection.Inspector) -> None:
    index_names = _players_index_names(inspector)
    if SAVES_INDEX_NAME in index_names:
        logger.info(
            {
                "message": "Players saves index already present",
                "index_name": SAVES_INDEX_NAME,
            }
        )
        return

    logger.info(
        {
            "message": "Creating players saves index",
            "index_name": SAVES_INDEX_NAME,
        }
    )
    op.create_index(
        SAVES_INDEX_NAME,
        PLAYERS_TABLE_NAME,
        [sa.text("(CAST(stats_json->>'saves' AS INTEGER))")],
        unique=False,
    )


def verify_players_saves_index(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    index_names = _players_index_names(inspector)
    if SAVES_INDEX_NAME not in index_names:
        logger.error(
            {
                "message": "Players saves index verification failed",
                "missing_index": SAVES_INDEX_NAME,
            }
        )
        raise RuntimeError(f"Missing players index: {SAVES_INDEX_NAME}")

    logger.info(
        {
            "message": "Players saves index verified",
            "indexes": sorted(index_names),
        }
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting players saves index migration"})
    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.warning(
            {
                "message": "Players table missing; skipping players saves index migration",
                "table_name": PLAYERS_TABLE_NAME,
            }
        )
        return

    _ensure_saves_index(inspector)
    verify_players_saves_index(bind)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Reverting players saves index migration"})
    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.warning(
            {
                "message": "Players table missing; skipping players saves index downgrade",
                "table_name": PLAYERS_TABLE_NAME,
            }
        )
        return

    index_names = _players_index_names(inspector)
    if SAVES_INDEX_NAME in index_names:
        op.drop_index(SAVES_INDEX_NAME, table_name=PLAYERS_TABLE_NAME)
