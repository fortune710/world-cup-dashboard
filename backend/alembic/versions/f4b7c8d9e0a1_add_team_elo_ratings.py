"""add team Elo ratings

Revision ID: f4b7c8d9e0a1
Revises: 738efcc7d62d
Create Date: 2026-06-02 21:45:00.000000
"""

import logging

from alembic import op
import sqlalchemy as sa


logger = logging.getLogger(__name__)


# revision identifiers, used by Alembic.
revision = "f4b7c8d9e0a1"
down_revision = "738efcc7d62d"
branch_labels = None
depends_on = None

MATCHES_TABLE_NAME = "matches"
TEAM_ELO_HISTORY_TABLE_NAME = "team_elo_history"
MATCHES_PRIMARY_KEY_NAME = "pk_matches"


def upgrade() -> None:
    logger.info({"message": "Starting migration to add team Elo ratings"})
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "teams" in tables:
        team_columns = {column["name"] for column in inspector.get_columns("teams")}
        if "elo_rating" not in team_columns:
            op.add_column("teams", sa.Column("elo_rating", sa.Float(), nullable=True, server_default="1500.0"))
            op.execute("UPDATE teams SET elo_rating = 1500.0 WHERE elo_rating IS NULL")
            op.alter_column("teams", "elo_rating", nullable=False)
            op.create_index(op.f("ix_teams_elo_rating"), "teams", ["elo_rating"], unique=False)
        else:
            op.execute("UPDATE teams SET elo_rating = 1500.0 WHERE elo_rating IS NULL")
            op.alter_column("teams", "elo_rating", nullable=False, server_default="1500.0")

    _ensure_matches_primary_key(bind)

    if TEAM_ELO_HISTORY_TABLE_NAME not in tables:
        op.create_table(
            TEAM_ELO_HISTORY_TABLE_NAME,
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("match_id", sa.Integer(), nullable=False),
            sa.Column("team_code", sa.String(), nullable=False),
            sa.Column("opponent_code", sa.String(), nullable=False),
            sa.Column("rating_before", sa.Float(), nullable=False),
            sa.Column("rating_after", sa.Float(), nullable=False),
            sa.Column("rating_delta", sa.Float(), nullable=False),
            sa.Column("expected_score", sa.Float(), nullable=False),
            sa.Column("actual_score", sa.Float(), nullable=False),
            sa.Column("stage_weight", sa.Float(), nullable=False),
            sa.Column("margin_multiplier", sa.Float(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["match_id"], [f"{MATCHES_TABLE_NAME}.id"]),
            sa.ForeignKeyConstraint(["opponent_code"], ["teams.code"]),
            sa.ForeignKeyConstraint(["team_code"], ["teams.code"]),
            sa.UniqueConstraint("match_id", "team_code", name="uq_team_elo_history_match_team"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_team_elo_history_id"), TEAM_ELO_HISTORY_TABLE_NAME, ["id"], unique=False)
        op.create_index(op.f("ix_team_elo_history_match_id"), TEAM_ELO_HISTORY_TABLE_NAME, ["match_id"], unique=False)
        op.create_index(op.f("ix_team_elo_history_team_code"), TEAM_ELO_HISTORY_TABLE_NAME, ["team_code"], unique=False)

    logger.info({"message": "Completed migration to add team Elo ratings"})


def _ensure_matches_primary_key(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Ensuring matches primary key exists before creating team elo history"})
    inspector = sa.inspect(bind)
    if MATCHES_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matches primary key repair because matches table is missing"})
        return

    pk = inspector.get_pk_constraint(MATCHES_TABLE_NAME) or {}
    if pk.get("constrained_columns") == ["id"]:
        logger.info({"message": "matches primary key already matches schema"})
        return

    logger.warning({"message": "Repairing matches primary key", "primary_key": pk.get("constrained_columns")})
    null_count = bind.execute(sa.text(f"SELECT COUNT(*) FROM {MATCHES_TABLE_NAME} WHERE id IS NULL")).scalar_one()
    duplicate_count = bind.execute(
        sa.text(
            f"""
            SELECT COUNT(*) FROM (
                SELECT id
                FROM {MATCHES_TABLE_NAME}
                GROUP BY id
                HAVING COUNT(*) > 1
            ) duplicate_ids
            """
        )
    ).scalar_one()

    if null_count or duplicate_count:
        logger.error(
            {
                "message": "Cannot repair matches primary key because duplicate or null ids exist",
                "null_id_count": int(null_count or 0),
                "duplicate_id_count": int(duplicate_count or 0),
            }
        )
        raise RuntimeError("Cannot create a primary key on matches.id until duplicate or null ids are removed")

    columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
    if "id" in columns:
        logger.info({"message": "Ensuring matches.id is not nullable before adding primary key"})
        op.alter_column(
            MATCHES_TABLE_NAME,
            "id",
            existing_type=sa.Integer(),
            nullable=False,
        )

    op.create_primary_key(MATCHES_PRIMARY_KEY_NAME, MATCHES_TABLE_NAME, ["id"])
    logger.info({"message": "matches primary key repaired"})


def downgrade() -> None:
    logger.info({"message": "Starting migration rollback for team Elo ratings"})
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if TEAM_ELO_HISTORY_TABLE_NAME in tables:
        op.drop_index(op.f("ix_team_elo_history_team_code"), table_name=TEAM_ELO_HISTORY_TABLE_NAME)
        op.drop_index(op.f("ix_team_elo_history_match_id"), table_name=TEAM_ELO_HISTORY_TABLE_NAME)
        op.drop_index(op.f("ix_team_elo_history_id"), table_name=TEAM_ELO_HISTORY_TABLE_NAME)
        op.drop_table(TEAM_ELO_HISTORY_TABLE_NAME)

    if "teams" in tables:
        team_columns = {column["name"] for column in inspector.get_columns("teams")}
        team_indexes = {index["name"] for index in inspector.get_indexes("teams")}
        if "ix_teams_elo_rating" in team_indexes:
            op.drop_index(op.f("ix_teams_elo_rating"), table_name="teams")
        if "elo_rating" in team_columns:
            op.drop_column("teams", "elo_rating")

    logger.info({"message": "Completed migration rollback for team Elo ratings"})
