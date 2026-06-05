"""add functional indexes on player stats json fields

Revision ID: c12345678901
Revises: 738efcc7d62d
Create Date: 2026-06-05 04:22:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'c12345678901'
down_revision = '738efcc7d62d'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    players_indexes = [idx['name'] for idx in inspector.get_indexes('players')]
    
    # Define functional indexes for stats_json fields
    # Format: index_name, cast_type
    stats_metrics = {
        'goals': 'INTEGER',
        'assists': 'INTEGER',
        'rating': 'FLOAT',
        'expected_goals': 'FLOAT',
        'expected_assists': 'FLOAT',
        'clean_sheet': 'INTEGER',
        'big_chances_created': 'INTEGER'
    }
    
    for field, cast_type in stats_metrics.items():
        index_name = f'ix_players_stats_{field}'
        if index_name not in players_indexes:
            # We use sa.text and ensure extra parentheses for functional index
            op.create_index(
                index_name,
                'players',
                [sa.text(f"(CAST(stats_json->>'{field}' AS {cast_type}))")],
                unique=False
            )

def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    players_indexes = [idx['name'] for idx in inspector.get_indexes('players')]
    
    stats_metrics = [
        'goals', 'assists', 'rating', 'expected_goals', 
        'expected_assists', 'clean_sheet', 'big_chances_created'
    ]
    
    for field in stats_metrics:
        index_name = f'ix_players_stats_{field}'
        if index_name in players_indexes:
            op.drop_index(index_name, table_name='players')
