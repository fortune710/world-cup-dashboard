"""add ml match outcome tables

Revision ID: b7e4a1f9c3d6
Revises: d1e2f3a4b5c6
Create Date: 2026-07-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'b7e4a1f9c3d6'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'historical_matches' not in tables:
        op.create_table(
            'historical_matches',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('tournament_year', sa.SmallInteger(), nullable=False),
            sa.Column('season_id', sa.Integer(), nullable=False),
            sa.Column('round', sa.String(), nullable=False),
            sa.Column('home_team_code', sa.String(), nullable=False),
            sa.Column('away_team_code', sa.String(), nullable=False),
            sa.Column('home_score', sa.SmallInteger(), nullable=True),
            sa.Column('away_score', sa.SmallInteger(), nullable=True),
            sa.Column('home_pen', sa.SmallInteger(), nullable=True),
            sa.Column('away_pen', sa.SmallInteger(), nullable=True),
            sa.Column('sofascore_event_id', sa.BigInteger(), nullable=True),
            sa.Column('kickoff_utc', sa.DateTime(), nullable=True),
            sa.Column('sofascore_detail', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('detail_indexed', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('sofascore_event_id'),
            sa.UniqueConstraint(
                'tournament_year', 'home_team_code', 'away_team_code', 'round', name='uq_historical_match'
            ),
        )
        op.create_index('ix_historical_matches_tournament_year', 'historical_matches', ['tournament_year'])
        op.create_index('ix_historical_matches_home_team_code', 'historical_matches', ['home_team_code'])
        op.create_index('ix_historical_matches_away_team_code', 'historical_matches', ['away_team_code'])
        op.create_index('ix_historical_matches_kickoff_utc', 'historical_matches', ['kickoff_utc'])
        op.create_index('ix_historical_matches_detail_indexed', 'historical_matches', ['detail_indexed'])

    if 'ml_elo_history' not in tables:
        op.create_table(
            'ml_elo_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('source', sa.String(), nullable=False),
            sa.Column('match_ref_id', sa.Integer(), nullable=False),
            sa.Column('match_date', sa.DateTime(), nullable=False),
            sa.Column('team_code', sa.String(), nullable=False),
            sa.Column('opponent_code', sa.String(), nullable=False),
            sa.Column('rating_before', sa.Float(), nullable=False),
            sa.Column('rating_after', sa.Float(), nullable=False),
            sa.Column('rating_delta', sa.Float(), nullable=False),
            sa.Column('expected_score', sa.Float(), nullable=False),
            sa.Column('actual_score', sa.Float(), nullable=False),
            sa.Column('stage_weight', sa.Float(), nullable=False),
            sa.Column('margin_multiplier', sa.Float(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_ml_elo_history_source', 'ml_elo_history', ['source'])
        op.create_index('ix_ml_elo_history_match_ref_id', 'ml_elo_history', ['match_ref_id'])
        op.create_index('ix_ml_elo_history_match_date', 'ml_elo_history', ['match_date'])
        op.create_index('ix_ml_elo_history_team_code', 'ml_elo_history', ['team_code'])

    if 'fifa_ranking_snapshot' not in tables:
        op.create_table(
            'fifa_ranking_snapshot',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('team_code', sa.String(), nullable=False),
            sa.Column('as_of_date', sa.Date(), nullable=False),
            sa.Column('rank', sa.SmallInteger(), nullable=True),
            sa.Column('points', sa.Float(), nullable=True),
            sa.Column('source_note', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('team_code', 'as_of_date', name='uq_fifa_ranking_snapshot'),
        )
        op.create_index('ix_fifa_ranking_snapshot_team_code', 'fifa_ranking_snapshot', ['team_code'])
        op.create_index('ix_fifa_ranking_snapshot_as_of_date', 'fifa_ranking_snapshot', ['as_of_date'])

    if 'training_examples' not in tables:
        op.create_table(
            'training_examples',
            sa.Column('id', sa.BigInteger(), nullable=False),
            sa.Column('historical_match_id', sa.Integer(), nullable=False),
            sa.Column('tournament_year', sa.SmallInteger(), nullable=False),
            sa.Column('round', sa.String(), nullable=False),
            sa.Column('home_team_code', sa.String(), nullable=False),
            sa.Column('away_team_code', sa.String(), nullable=False),
            sa.Column('kickoff_utc', sa.DateTime(), nullable=True),
            sa.Column('features', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column('label_home_advanced', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['historical_match_id'], ['historical_matches.id']),
            sa.UniqueConstraint('historical_match_id'),
        )
        op.create_index('ix_training_examples_tournament_year', 'training_examples', ['tournament_year'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'training_examples' in tables:
        op.drop_table('training_examples')
    if 'fifa_ranking_snapshot' in tables:
        op.drop_table('fifa_ranking_snapshot')
    if 'ml_elo_history' in tables:
        op.drop_table('ml_elo_history')
    if 'historical_matches' in tables:
        op.drop_table('historical_matches')
