"""add ml match-outcome tables

Revision ID: 1a2b3c4d5e6f
Revises: d1e2f3a4b5c6
Create Date: 2026-07-08 00:00:00.000000
"""

import logging

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


logger = logging.getLogger(__name__)


# revision identifiers, used by Alembic.
revision = "1a2b3c4d5e6f"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None

HISTORICAL_MATCHES_TABLE_NAME = "historical_matches"
FIFA_RANKING_SNAPSHOT_TABLE_NAME = "fifa_ranking_snapshot"
ML_ELO_HISTORY_TABLE_NAME = "ml_elo_history"
TRAINING_EXAMPLES_TABLE_NAME = "training_examples"


def upgrade() -> None:
    logger.info({"message": "Starting migration to add ml match-outcome tables"})
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if HISTORICAL_MATCHES_TABLE_NAME not in tables:
        op.create_table(
            HISTORICAL_MATCHES_TABLE_NAME,
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tournament_year", sa.Integer(), nullable=False),
            sa.Column("season_id", sa.Integer(), nullable=False),
            sa.Column("round", sa.String(), nullable=False),
            sa.Column("home_team_code", sa.String(), nullable=False),
            sa.Column("away_team_code", sa.String(), nullable=False),
            sa.Column("home_team_name", sa.String(), nullable=False),
            sa.Column("away_team_name", sa.String(), nullable=False),
            sa.Column("kickoff_utc", sa.DateTime(), nullable=False),
            sa.Column("home_score", sa.Integer(), nullable=False),
            sa.Column("away_score", sa.Integer(), nullable=False),
            sa.Column("home_pen", sa.Integer(), nullable=True),
            sa.Column("away_pen", sa.Integer(), nullable=True),
            sa.Column("sofascore_id", sa.BigInteger(), nullable=True),
            sa.Column("detail_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("detail_indexed", sa.Boolean(), server_default="false", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint(
                "season_id", "home_team_code", "away_team_code", "round",
                name="uq_historical_matches_season_teams_round",
            ),
            sa.UniqueConstraint("sofascore_id", name="uq_historical_matches_sofascore_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_historical_matches_id"), HISTORICAL_MATCHES_TABLE_NAME, ["id"], unique=False)
        op.create_index(
            op.f("ix_historical_matches_tournament_year"), HISTORICAL_MATCHES_TABLE_NAME, ["tournament_year"], unique=False
        )
        op.create_index(
            op.f("ix_historical_matches_season_id"), HISTORICAL_MATCHES_TABLE_NAME, ["season_id"], unique=False
        )
        op.create_index(
            op.f("ix_historical_matches_home_team_code"), HISTORICAL_MATCHES_TABLE_NAME, ["home_team_code"], unique=False
        )
        op.create_index(
            op.f("ix_historical_matches_away_team_code"), HISTORICAL_MATCHES_TABLE_NAME, ["away_team_code"], unique=False
        )
        op.create_index(
            op.f("ix_historical_matches_kickoff_utc"), HISTORICAL_MATCHES_TABLE_NAME, ["kickoff_utc"], unique=False
        )
        op.create_index(
            op.f("ix_historical_matches_sofascore_id"), HISTORICAL_MATCHES_TABLE_NAME, ["sofascore_id"], unique=True
        )
        op.create_index(
            op.f("ix_historical_matches_detail_indexed"), HISTORICAL_MATCHES_TABLE_NAME, ["detail_indexed"], unique=False
        )

    if FIFA_RANKING_SNAPSHOT_TABLE_NAME not in tables:
        op.create_table(
            FIFA_RANKING_SNAPSHOT_TABLE_NAME,
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("team_code", sa.String(), nullable=False),
            sa.Column("team_name_raw", sa.String(), nullable=False),
            sa.Column("as_of_date", sa.Date(), nullable=False),
            sa.Column("rank", sa.Integer(), nullable=False),
            sa.Column("points", sa.Float(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint("team_code", "as_of_date", name="uq_fifa_ranking_snapshot_team_date"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_fifa_ranking_snapshot_id"), FIFA_RANKING_SNAPSHOT_TABLE_NAME, ["id"], unique=False
        )
        op.create_index(
            op.f("ix_fifa_ranking_snapshot_team_code"), FIFA_RANKING_SNAPSHOT_TABLE_NAME, ["team_code"], unique=False
        )
        op.create_index(
            op.f("ix_fifa_ranking_snapshot_as_of_date"), FIFA_RANKING_SNAPSHOT_TABLE_NAME, ["as_of_date"], unique=False
        )

    if ML_ELO_HISTORY_TABLE_NAME not in tables:
        op.create_table(
            ML_ELO_HISTORY_TABLE_NAME,
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("source_match_table", sa.String(), nullable=False),
            sa.Column("source_match_id", sa.Integer(), nullable=False),
            sa.Column("match_date", sa.DateTime(), nullable=False),
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
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_ml_elo_history_id"), ML_ELO_HISTORY_TABLE_NAME, ["id"], unique=False)
        op.create_index(
            op.f("ix_ml_elo_history_source_match_table"), ML_ELO_HISTORY_TABLE_NAME, ["source_match_table"], unique=False
        )
        op.create_index(
            op.f("ix_ml_elo_history_source_match_id"), ML_ELO_HISTORY_TABLE_NAME, ["source_match_id"], unique=False
        )
        op.create_index(op.f("ix_ml_elo_history_match_date"), ML_ELO_HISTORY_TABLE_NAME, ["match_date"], unique=False)
        op.create_index(op.f("ix_ml_elo_history_team_code"), ML_ELO_HISTORY_TABLE_NAME, ["team_code"], unique=False)

    if TRAINING_EXAMPLES_TABLE_NAME not in tables:
        op.create_table(
            TRAINING_EXAMPLES_TABLE_NAME,
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("historical_match_id", sa.Integer(), nullable=False),
            sa.Column("tournament_year", sa.Integer(), nullable=False),
            sa.Column("round", sa.String(), nullable=False),
            sa.Column("kickoff_utc", sa.DateTime(), nullable=False),
            sa.Column("home_team_code", sa.String(), nullable=False),
            sa.Column("away_team_code", sa.String(), nullable=False),
            sa.Column("home_elo", sa.Float(), nullable=False),
            sa.Column("away_elo", sa.Float(), nullable=False),
            sa.Column("elo_diff", sa.Float(), nullable=False),
            sa.Column("elo_delta_home", sa.Float(), nullable=True),
            sa.Column("elo_delta_away", sa.Float(), nullable=True),
            sa.Column("home_fifa_rank", sa.Integer(), nullable=True),
            sa.Column("away_fifa_rank", sa.Integer(), nullable=True),
            sa.Column("home_goals_scored_l5", sa.Float(), nullable=True),
            sa.Column("home_goals_conceded_l5", sa.Float(), nullable=True),
            sa.Column("home_wins_l5", sa.Integer(), nullable=True),
            sa.Column("home_draws_l5", sa.Integer(), nullable=True),
            sa.Column("away_goals_scored_l5", sa.Float(), nullable=True),
            sa.Column("away_goals_conceded_l5", sa.Float(), nullable=True),
            sa.Column("away_wins_l5", sa.Integer(), nullable=True),
            sa.Column("away_draws_l5", sa.Integer(), nullable=True),
            sa.Column("home_xg_for_l5", sa.Float(), nullable=True),
            sa.Column("home_xg_against_l5", sa.Float(), nullable=True),
            sa.Column("away_xg_for_l5", sa.Float(), nullable=True),
            sa.Column("away_xg_against_l5", sa.Float(), nullable=True),
            sa.Column("stage_weight", sa.Float(), nullable=False),
            sa.Column("is_neutral", sa.Boolean(), nullable=False),
            sa.Column("is_host", sa.Boolean(), nullable=False),
            sa.Column("h2h_wins_home", sa.Integer(), nullable=True),
            sa.Column("h2h_wins_away", sa.Integer(), nullable=True),
            sa.Column("h2h_draws", sa.Integer(), nullable=True),
            sa.Column("days_rest_home", sa.Integer(), nullable=True),
            sa.Column("days_rest_away", sa.Integer(), nullable=True),
            sa.Column("avg_player_rating_home", sa.Float(), nullable=True),
            sa.Column("avg_player_rating_away", sa.Float(), nullable=True),
            sa.Column("injured_key_players_home", sa.Boolean(), nullable=False),
            sa.Column("injured_key_players_away", sa.Boolean(), nullable=False),
            sa.Column("tournament_goals_scored_home", sa.Float(), nullable=True),
            sa.Column("tournament_goals_conceded_home", sa.Float(), nullable=True),
            sa.Column("tournament_wins_home", sa.Integer(), nullable=True),
            sa.Column("tournament_draws_home", sa.Integer(), nullable=True),
            sa.Column("tournament_goals_scored_away", sa.Float(), nullable=True),
            sa.Column("tournament_goals_conceded_away", sa.Float(), nullable=True),
            sa.Column("tournament_wins_away", sa.Integer(), nullable=True),
            sa.Column("tournament_draws_away", sa.Integer(), nullable=True),
            sa.Column("label_home_advanced", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["historical_match_id"], [f"{HISTORICAL_MATCHES_TABLE_NAME}.id"]),
            sa.UniqueConstraint("historical_match_id", name="uq_training_examples_historical_match_id"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_training_examples_id"), TRAINING_EXAMPLES_TABLE_NAME, ["id"], unique=False)
        op.create_index(
            op.f("ix_training_examples_historical_match_id"), TRAINING_EXAMPLES_TABLE_NAME, ["historical_match_id"],
            unique=True,
        )
        op.create_index(
            op.f("ix_training_examples_tournament_year"), TRAINING_EXAMPLES_TABLE_NAME, ["tournament_year"], unique=False
        )
        op.create_index(
            op.f("ix_training_examples_home_team_code"), TRAINING_EXAMPLES_TABLE_NAME, ["home_team_code"], unique=False
        )
        op.create_index(
            op.f("ix_training_examples_away_team_code"), TRAINING_EXAMPLES_TABLE_NAME, ["away_team_code"], unique=False
        )

    logger.info({"message": "Completed migration to add ml match-outcome tables"})


def downgrade() -> None:
    logger.info({"message": "Starting migration rollback for ml match-outcome tables"})
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if TRAINING_EXAMPLES_TABLE_NAME in tables:
        op.drop_table(TRAINING_EXAMPLES_TABLE_NAME)

    if ML_ELO_HISTORY_TABLE_NAME in tables:
        op.drop_table(ML_ELO_HISTORY_TABLE_NAME)

    if FIFA_RANKING_SNAPSHOT_TABLE_NAME in tables:
        op.drop_table(FIFA_RANKING_SNAPSHOT_TABLE_NAME)

    if HISTORICAL_MATCHES_TABLE_NAME in tables:
        op.drop_table(HISTORICAL_MATCHES_TABLE_NAME)

    logger.info({"message": "Completed migration rollback for ml match-outcome tables"})
