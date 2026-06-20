"""add player stats json indexes for team statistics ranking

Revision ID: d1e2f3a4b5c6
Revises: c8e1f2a3b4c5
Create Date: 2026-06-20 20:00:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "d1e2f3a4b5c6"
down_revision = "c8e1f2a3b4c5"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

PLAYERS_TABLE = "players"
MATCHES_TABLE = "matches"

STATS_INDEXES = {
    "accurate_passes_percentage": "FLOAT",
    "yellow_cards": "INTEGER",
    "red_cards": "INTEGER",
    "minutes_played": "INTEGER",
}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    logger.info({"message": "Starting team stats json indexes migration"})

    if PLAYERS_TABLE not in inspector.get_table_names():
        logger.info({"message": "Players table missing; skipping stats json index migration"})
        return

    players_indexes = {idx["name"] for idx in inspector.get_indexes(PLAYERS_TABLE)}

    for field, cast_type in STATS_INDEXES.items():
        index_name = f"ix_players_stats_{field}"
        if index_name in players_indexes:
            logger.info(
                {
                    "message": "Player stats json index already exists",
                    "index_name": index_name,
                }
            )
            continue

        logger.info(
            {
                "message": "Creating player stats json index",
                "index_name": index_name,
                "field": field,
            }
        )
        op.create_index(
            index_name,
            PLAYERS_TABLE,
            [sa.text(f"(CAST(stats_json->>'{field}' AS {cast_type}))")],
            unique=False,
        )
        logger.info(
            {
                "message": "Created player stats json index",
                "index_name": index_name,
            }
        )

    matches_indexes = {idx["name"] for idx in inspector.get_indexes(MATCHES_TABLE)} if MATCHES_TABLE in inspector.get_table_names() else set()
    for column_name in ("home_team_code", "away_team_code"):
        index_name = f"ix_matches_{column_name}"
        if index_name in matches_indexes:
            logger.info(
                {
                    "message": "Matches team code index already exists",
                    "index_name": index_name,
                }
            )
            continue
        if MATCHES_TABLE not in inspector.get_table_names():
            continue
        logger.info(
            {
                "message": "Creating matches team code index",
                "index_name": index_name,
            }
        )
        op.create_index(index_name, MATCHES_TABLE, [column_name], unique=False)

    logger.info({"message": "Completed team stats json indexes migration"})


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    logger.info({"message": "Starting team stats json indexes downgrade"})

    if PLAYERS_TABLE not in inspector.get_table_names():
        logger.info({"message": "Players table missing; skipping stats json index downgrade"})
        return

    players_indexes = {idx["name"] for idx in inspector.get_indexes(PLAYERS_TABLE)}

    for field in STATS_INDEXES:
        index_name = f"ix_players_stats_{field}"
        if index_name not in players_indexes:
            logger.info(
                {
                    "message": "Player stats json index already absent",
                    "index_name": index_name,
                }
            )
            continue

        logger.info(
            {
                "message": "Dropping player stats json index",
                "index_name": index_name,
            }
        )
        op.drop_index(index_name, table_name=PLAYERS_TABLE)

    if MATCHES_TABLE in inspector.get_table_names():
        matches_indexes = {idx["name"] for idx in inspector.get_indexes(MATCHES_TABLE)}
        for column_name in ("home_team_code", "away_team_code"):
            index_name = f"ix_matches_{column_name}"
            if index_name in matches_indexes:
                op.drop_index(index_name, table_name=MATCHES_TABLE)

    logger.info({"message": "Completed team stats json indexes downgrade"})
