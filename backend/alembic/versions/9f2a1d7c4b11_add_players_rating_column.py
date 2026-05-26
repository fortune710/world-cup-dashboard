"""add players.rating column if missing

Revision ID: 9f2a1d7c4b11
Revises: 7461041c429e
Create Date: 2026-05-25 22:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9f2a1d7c4b11"
down_revision = "7461041c429e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    column_names = {column["name"] for column in inspector.get_columns("players")}
    if "rating" not in column_names:
        op.add_column("players", sa.Column("rating", sa.Float(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    column_names = {column["name"] for column in inspector.get_columns("players")}
    if "rating" in column_names:
        op.drop_column("players", "rating")
