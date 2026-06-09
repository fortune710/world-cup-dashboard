"""merge elo and stats_json heads

Revision ID: e22f733e64a6
Revises: d23456789012, f4b7c8d9e0a1
Create Date: 2026-06-05 18:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e22f733e64a6'
down_revision = ('d23456789012', 'f4b7c8d9e0a1')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
