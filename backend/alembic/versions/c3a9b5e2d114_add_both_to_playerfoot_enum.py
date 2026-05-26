"""add Both to playerfoot enum

Revision ID: c3a9b5e2d114
Revises: 9f2a1d7c4b11
Create Date: 2026-05-25 23:05:00.000000
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "c3a9b5e2d114"
down_revision = "9f2a1d7c4b11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE playerfoot ADD VALUE IF NOT EXISTS 'Both'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely in-place.
    pass
