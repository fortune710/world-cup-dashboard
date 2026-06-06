"""add Both to playerfoot enum

Revision ID: c3a9b5e2d114
Revises: 9f2a1d7c4b11
Create Date: 2026-05-25 23:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3a9b5e2d114"
down_revision = "9f2a1d7c4b11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use a raw connection to check for type existence and create/alter
    bind = op.get_bind()
    result = bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'playerfoot'"))
    exists = result.scalar() is not None

    if not exists:
        op.execute("CREATE TYPE playerfoot AS ENUM ('Left', 'Right', 'Both')")
    else:
        op.execute("ALTER TYPE playerfoot ADD VALUE IF NOT EXISTS 'Both'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely in-place.
    pass
