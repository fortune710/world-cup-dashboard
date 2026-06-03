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


def upgrade() -> None:
    logger.info({"message": "Starting migration to add team Elo ratings"})
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "teams" in tables:
        team_columns = {column["name"] for column in inspector.get_columns("teams")}
        if "elo_rating" not in team_columns:
            op.add_column("teams", sa.Column("elo_rating", sa.Float(), nullable=True, server_default="1500"))
            op.create_index(op.f("ix_teams_elo_rating"), "teams", ["elo_rating"], unique=False)

    if "team_elo_history" not in tables:
        op.create_table(
            "team_elo_history",
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
            sa.ForeignKeyConstraint(["match_id"], ["matches.id"]),
            sa.ForeignKeyConstraint(["opponent_code"], ["teams.code"]),
            sa.ForeignKeyConstraint(["team_code"], ["teams.code"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_team_elo_history_id"), "team_elo_history", ["id"], unique=False)
        op.create_index(op.f("ix_team_elo_history_match_id"), "team_elo_history", ["match_id"], unique=False)
        op.create_index(op.f("ix_team_elo_history_team_code"), "team_elo_history", ["team_code"], unique=False)

    logger.info({"message": "Completed migration to add team Elo ratings"})


def downgrade() -> None:
    logger.info({"message": "Starting migration rollback for team Elo ratings"})
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "team_elo_history" in tables:
        op.drop_index(op.f("ix_team_elo_history_team_code"), table_name="team_elo_history")
        op.drop_index(op.f("ix_team_elo_history_match_id"), table_name="team_elo_history")
        op.drop_index(op.f("ix_team_elo_history_id"), table_name="team_elo_history")
        op.drop_table("team_elo_history")

    if "teams" in tables:
        team_columns = {column["name"] for column in inspector.get_columns("teams")}
        team_indexes = {index["name"] for index in inspector.get_indexes("teams")}
        if "ix_teams_elo_rating" in team_indexes:
            op.drop_index(op.f("ix_teams_elo_rating"), table_name="teams")
        if "elo_rating" in team_columns:
            op.drop_column("teams", "elo_rating")

    logger.info({"message": "Completed migration rollback for team Elo ratings"})
