"""merge matchday and elo heads

Revision ID: 6c2d7f8a9b1e
Revises: b1d0a7c5e9f2, e22f733e64a6
Create Date: 2026-06-11 00:00:00.000000
"""

from __future__ import annotations

import logging

# revision identifiers, used by Alembic.
revision = "6c2d7f8a9b1e"
down_revision = ("b1d0a7c5e9f2", "e22f733e64a6")
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)


def upgrade() -> None:
    logger.info(
        {
            "message": "Running Alembic merge migration for matchday and elo heads",
            "revision": revision,
            "down_revision": list(down_revision),
        }
    )


def downgrade() -> None:
    logger.info(
        {
            "message": "Reverting Alembic merge migration for matchday and elo heads",
            "revision": revision,
            "down_revision": list(down_revision),
        }
    )
