"""players country_code non-unique and club_id -> club_name

Revision ID: e1d4a8f7c221
Revises: c3a9b5e2d114
Create Date: 2026-05-25 23:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e1d4a8f7c221"
down_revision = "c3a9b5e2d114"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("players")}
    indexes = {index["name"] for index in inspector.get_indexes("players")}

    # Remove unique index/constraint on country_code (keep non-unique index).
    op.execute("DROP INDEX IF EXISTS ix_players_country_code")
    op.execute("CREATE INDEX IF NOT EXISTS ix_players_country_code ON players (country_code)")

    # Convert club_id -> club_name.
    if "club_id" in columns and "club_name" not in columns:
        op.add_column("players", sa.Column("club_name", sa.String(), nullable=True))
        op.execute("UPDATE players SET club_name = club_id::text WHERE club_id IS NOT NULL")
        if "ix_players_club_id" in indexes:
            op.drop_index("ix_players_club_id", table_name="players")
        op.drop_column("players", "club_id")
        op.execute("CREATE INDEX IF NOT EXISTS ix_players_club_name ON players (club_name)")
    elif "club_name" in columns:
        op.execute("CREATE INDEX IF NOT EXISTS ix_players_club_name ON players (club_name)")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("players")}

    if "club_name" in columns and "club_id" not in columns:
        op.add_column("players", sa.Column("club_id", sa.BigInteger(), nullable=True))
        op.execute("DROP INDEX IF EXISTS ix_players_club_name")
        op.drop_column("players", "club_name")
        op.execute("CREATE INDEX IF NOT EXISTS ix_players_club_id ON players (club_id)")

    op.execute("DROP INDEX IF EXISTS ix_players_country_code")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_players_country_code ON players (country_code)")
