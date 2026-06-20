"""add players name trigram index for fuzzy search

Revision ID: c8e1f2a3b4c5
Revises: b2c4d6e8f0a1
Create Date: 2026-06-20 17:00:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c8e1f2a3b4c5"
down_revision = "b2c4d6e8f0a1"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

PLAYERS_TABLE_NAME = "players"
NAME_TRGM_INDEX_NAME = "ix_players_name_trgm"


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


def _ensure_pg_trgm_extension(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Ensuring pg_trgm extension is enabled"})
    bind.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
    logger.info({"message": "pg_trgm extension is enabled"})


def _ensure_name_trgm_index(bind: sa.engine.Connection, inspector: sa.engine.reflection.Inspector) -> None:
    index_names = _players_index_names(inspector)
    if NAME_TRGM_INDEX_NAME in index_names:
        logger.info(
            {
                "message": "Players name trigram index already present",
                "index_name": NAME_TRGM_INDEX_NAME,
            }
        )
        return

    logger.info(
        {
            "message": "Creating players name trigram index",
            "index_name": NAME_TRGM_INDEX_NAME,
        }
    )
    op.create_index(
        NAME_TRGM_INDEX_NAME,
        PLAYERS_TABLE_NAME,
        ["name"],
        unique=False,
        postgresql_using="gin",
        postgresql_ops={"name": "gin_trgm_ops"},
    )


def verify_players_name_trgm_index(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    index_names = _players_index_names(inspector)
    if NAME_TRGM_INDEX_NAME not in index_names:
        logger.error(
            {
                "message": "Players name trigram index verification failed",
                "missing_index": NAME_TRGM_INDEX_NAME,
            }
        )
        raise RuntimeError(f"Missing players index: {NAME_TRGM_INDEX_NAME}")

    logger.info(
        {
            "message": "Players name trigram index verified",
            "index_name": NAME_TRGM_INDEX_NAME,
        }
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting players name trigram index migration"})
    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.warning(
            {
                "message": "Players table missing; skipping players name trigram index migration",
                "table_name": PLAYERS_TABLE_NAME,
            }
        )
        return

    _ensure_pg_trgm_extension(bind)
    _ensure_name_trgm_index(bind, inspector)
    verify_players_name_trgm_index(bind)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Reverting players name trigram index migration"})
    if PLAYERS_TABLE_NAME not in inspector.get_table_names():
        logger.warning(
            {
                "message": "Players table missing; skipping players name trigram index downgrade",
                "table_name": PLAYERS_TABLE_NAME,
            }
        )
        return

    index_names = _players_index_names(inspector)
    if NAME_TRGM_INDEX_NAME in index_names:
        op.drop_index(NAME_TRGM_INDEX_NAME, table_name=PLAYERS_TABLE_NAME)
