"""add_indexes_for_sorting_and_filtering_v2

Revision ID: 738efcc7d62d
Revises: e1d4a8f7c221
Create Date: 2026-06-02 19:13:10.853840

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '738efcc7d62d'
down_revision = 'e1d4a8f7c221'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Handle matches indexes
    matches_indexes = [idx['name'] for idx in inspector.get_indexes('matches')]
    if 'ix_matches_kickoff_utc' not in matches_indexes:
        op.create_index('ix_matches_kickoff_utc', 'matches', ['kickoff_utc'], unique=False)
    if 'ix_matches_status' not in matches_indexes:
        op.create_index('ix_matches_status', 'matches', ['status'], unique=False)

    # Handle players changes
    players_columns = [col['name'] for col in inspector.get_columns('players')]
    if 'stats_json' not in players_columns:
        op.add_column('players', sa.Column('stats_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Type change (safer to just try or check type, but usually alter is okay if done carefully)
    op.alter_column('players', 'club_name',
               existing_type=sa.TEXT(),
               type_=sa.String(),
               existing_nullable=True)
               
    players_indexes = [idx['name'] for idx in inspector.get_indexes('players')]
    if 'ix_players_rating' not in players_indexes:
        op.create_index('ix_players_rating', 'players', ['rating'], unique=False)

    # Handle teams indexes
    teams_indexes = [idx['name'] for idx in inspector.get_indexes('teams')]
    if 'ix_teams_group' not in teams_indexes:
        op.create_index('ix_teams_group', 'teams', ['group'], unique=False)
    if 'ix_teams_players_indexed' not in teams_indexes:
        op.create_index('ix_teams_players_indexed', 'teams', ['players_indexed'], unique=False)
    if 'ix_teams_points' not in teams_indexes:
        op.create_index('ix_teams_points', 'teams', ['points'], unique=False)


def downgrade() -> None:
    # Downgrades are generally more specific, but we can add checks here too if needed
    op.drop_index(op.f('ix_teams_points'), table_name='teams')
    op.drop_index(op.f('ix_teams_players_indexed'), table_name='teams')
    op.drop_index(op.f('ix_teams_group'), table_name='teams')
    op.drop_index(op.f('ix_players_rating'), table_name='players')
    op.alter_column('players', 'club_name',
               existing_type=sa.String(),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.drop_column('players', 'stats_json')
    op.drop_index(op.f('ix_matches_status'), table_name='matches')
    op.drop_index(op.f('ix_matches_kickoff_utc'), table_name='matches')
