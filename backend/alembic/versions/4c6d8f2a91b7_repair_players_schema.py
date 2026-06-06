"""repair players schema

Revision ID: 4c6d8f2a91b7
Revises: d23456789012
Create Date: 2026-06-06 02:00:00.000000
"""

from __future__ import annotations

import logging
from typing import Iterable

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from db.models.players import Player

# revision identifiers, used by Alembic.
revision = "4c6d8f2a91b7"
down_revision = ("0f469d92e454", "e1d4a8f7c221")
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

PLAYER_CLASSIFICATION_ENUM = sa.Enum("G", "D", "M", "F", name="playerclassification")
PLAYER_FOOT_ENUM = sa.Enum("Left", "Right", "Both", name="playerfoot")
PLAYER_STATS_JSON_TYPE = postgresql.JSONB(astext_type=sa.Text())

EXPECTED_COLUMN_SPECS = {
    "id": {
        "type": sa.BigInteger(),
        "using": "NULLIF(id::text, '')::bigint",
        "nullable": False,
    },
    "name": {
        "type": sa.String(),
        "using": None,
    },
    "date_of_birth": {
        "type": sa.Date(),
        "using": "NULLIF(date_of_birth::text, '')::date",
    },
    "classification": {
        "type": PLAYER_CLASSIFICATION_ENUM,
        "using": "classification::text::playerclassification",
    },
    "club_name": {
        "type": sa.String(),
        "using": None,
    },
    "positions": {
        "type": sa.String(),
        "using": None,
    },
    "weight_kg": {
        "type": sa.SmallInteger(),
        "using": "NULLIF(weight_kg::text, '')::smallint",
    },
    "height_cm": {
        "type": sa.SmallInteger(),
        "using": "NULLIF(height_cm::text, '')::smallint",
    },
    "foot": {
        "type": PLAYER_FOOT_ENUM,
        "using": "foot::text::playerfoot",
    },
    "country_code": {
        "type": sa.String(length=3),
        "using": "country_code::varchar(3)",
    },
    "market_value": {
        "type": sa.BigInteger(),
        "using": "NULLIF(market_value::text, '')::bigint",
    },
    "image_url": {
        "type": sa.String(),
        "using": None,
    },
    "rating": {
        "type": sa.Float(),
        "using": "NULLIF(rating::text, '')::double precision",
    },
    "stats_json": {
        "type": PLAYER_STATS_JSON_TYPE,
        "using": "stats_json::jsonb",
    },
}


def _column_type_matches(actual_type: sa.types.TypeEngine, expected_type: sa.types.TypeEngine) -> bool:
    logger.info(
        {
            "message": "Comparing players column type",
            "actual_type": str(actual_type),
            "expected_type": str(expected_type),
        }
    )

    if isinstance(expected_type, sa.String):
        if not isinstance(actual_type, sa.String):
            return False
        if expected_type.length is None:
            return True
        return getattr(actual_type, "length", None) == expected_type.length

    if isinstance(expected_type, sa.Enum):
        if not isinstance(actual_type, sa.Enum):
            return False
        return (
            tuple(getattr(actual_type, "enums", ())) == tuple(expected_type.enums)
            and getattr(actual_type, "name", None) == expected_type.name
        )

    if isinstance(expected_type, postgresql.JSONB):
        return isinstance(actual_type, postgresql.JSONB)

    return isinstance(actual_type, expected_type.__class__)


def _players_schema_report(inspector: sa.engine.reflection.Inspector) -> dict:
    logger.info({"message": "Building players schema report"})
    tables = inspector.get_table_names()
    if "players" not in tables:
        report = {
            "table_exists": False,
            "primary_key": None,
            "missing_columns": list(EXPECTED_COLUMN_SPECS.keys()),
            "mismatched_columns": {},
            "foreign_keys_ok": False,
        }
        logger.info({"message": "Players schema report complete", "report": report})
        return report

    columns = {column["name"]: column for column in inspector.get_columns("players")}
    primary_key = inspector.get_pk_constraint("players") or {}
    foreign_keys = inspector.get_foreign_keys("players")

    missing_columns = [name for name in EXPECTED_COLUMN_SPECS if name not in columns]
    mismatched_columns = {}
    for column_name, spec in EXPECTED_COLUMN_SPECS.items():
        if column_name not in columns:
            continue
        if not _column_type_matches(columns[column_name]["type"], spec["type"]):
            mismatched_columns[column_name] = {
                "current_type": str(columns[column_name]["type"]),
                "expected_type": str(spec["type"]),
            }

    foreign_keys_ok = any(
        fk.get("constrained_columns") == ["country_code"]
        and fk.get("referred_table") == "teams"
        and fk.get("referred_columns") == ["code"]
        for fk in foreign_keys
    )

    report = {
        "table_exists": True,
        "primary_key": primary_key.get("constrained_columns"),
        "missing_columns": missing_columns,
        "mismatched_columns": mismatched_columns,
        "foreign_keys_ok": foreign_keys_ok,
    }
    logger.info({"message": "Players schema report complete", "report": report})
    return report


def _ensure_enum_types(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Ensuring players enum types exist"})
    PLAYER_CLASSIFICATION_ENUM.create(bind, checkfirst=True)
    PLAYER_FOOT_ENUM.create(bind, checkfirst=True)
    logger.info({"message": "Players enum types verified"})


def _ensure_players_table(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if "players" in inspector.get_table_names():
        logger.info({"message": "Players table already exists"})
        return

    logger.info({"message": "Players table missing; creating current schema"})
    copied_columns = [column.copy() for column in Player.__table__.columns]
    op.create_table(
        "players",
        *copied_columns,
        sa.PrimaryKeyConstraint("id", name="pk_players"),
    )
    logger.info({"message": "Players table created"})


def _ensure_players_primary_key(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    report = _players_schema_report(inspector)
    if not report["table_exists"]:
        logger.info({"message": "Skipping players primary key repair because table is missing"})
        return

    if report["primary_key"] == ["id"]:
        logger.info({"message": "Players primary key already matches schema"})
        return

    logger.warning(
        {
            "message": "Repairing players primary key",
            "primary_key": report["primary_key"],
        }
    )
    null_count = bind.execute(sa.text("SELECT COUNT(*) FROM players WHERE id IS NULL")).scalar_one()
    duplicate_count = bind.execute(
        sa.text(
            """
            SELECT COUNT(*) FROM (
                SELECT id
                FROM players
                GROUP BY id
                HAVING COUNT(*) > 1
            ) duplicate_ids
            """
        )
    ).scalar_one()

    if null_count or duplicate_count:
        logger.error(
            {
                "message": "Cannot repair players primary key because duplicate or null ids exist",
                "null_id_count": int(null_count or 0),
                "duplicate_id_count": int(duplicate_count or 0),
            }
        )
        raise RuntimeError(
            "Cannot create a primary key on players.id until duplicate or null ids are removed"
        )

    if "id" in {column["name"] for column in inspector.get_columns("players")}:
        logger.info({"message": "Ensuring players.id is not nullable before adding primary key"})
        op.alter_column(
            "players",
            "id",
            existing_type=sa.BigInteger(),
            nullable=False,
        )

    op.create_primary_key("pk_players", "players", ["id"])
    logger.info({"message": "Players primary key repaired"})


def _ensure_players_column_types(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if "players" not in inspector.get_table_names():
        logger.info({"message": "Skipping players column type repair because table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns("players")}
    for column_name, spec in EXPECTED_COLUMN_SPECS.items():
        if column_name not in columns:
            logger.warning(
                {
                    "message": "Players column missing during repair",
                    "column_name": column_name,
                }
            )
            continue

        current_type = columns[column_name]["type"]
        if _column_type_matches(current_type, spec["type"]):
            logger.info(
                {
                    "message": "Players column type already matches",
                    "column_name": column_name,
                    "current_type": str(current_type),
                }
            )
            continue

        logger.warning(
            {
                "message": "Repairing players column type",
                "column_name": column_name,
                "current_type": str(current_type),
                "expected_type": str(spec["type"]),
            }
        )
        alter_kwargs = {
            "existing_type": current_type,
            "type_": spec["type"],
        }
        if "nullable" in columns[column_name]:
            alter_kwargs["existing_nullable"] = columns[column_name]["nullable"]
        if spec.get("using"):
            alter_kwargs["postgresql_using"] = spec["using"]
        op.alter_column("players", column_name, **alter_kwargs)

    logger.info({"message": "Players column type repair complete"})


def _ensure_players_foreign_key(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if "players" not in inspector.get_table_names():
        logger.info({"message": "Skipping players foreign key repair because table is missing"})
        return

    foreign_keys = inspector.get_foreign_keys("players")
    if any(
        fk.get("constrained_columns") == ["country_code"]
        and fk.get("referred_table") == "teams"
        and fk.get("referred_columns") == ["code"]
        for fk in foreign_keys
    ):
        logger.info({"message": "Players foreign key already matches schema"})
        return

    logger.warning({"message": "Repairing players.country_code foreign key"})
    op.create_foreign_key(None, "players", "teams", ["country_code"], ["code"])
    logger.info({"message": "Players foreign key repaired"})


def verify_players_schema(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Verifying players schema after repair"})
    report = _players_schema_report(sa.inspect(bind))
    if report["table_exists"] and report["primary_key"] == ["id"]:
        if not report["missing_columns"] and not report["mismatched_columns"] and report["foreign_keys_ok"]:
            logger.info({"message": "Players schema verification passed"})
            return

    logger.error({"message": "Players schema verification failed", "report": report})
    raise RuntimeError(f"Players schema verification failed: {report}")


def upgrade() -> None:
    bind = op.get_bind()
    logger.info({"message": "Starting players schema repair migration"})
    _ensure_enum_types(bind)
    _ensure_players_table(bind)
    _ensure_players_primary_key(bind)
    _ensure_players_column_types(bind)
    _ensure_players_foreign_key(bind)
    verify_players_schema(bind)
    logger.info({"message": "Completed players schema repair migration"})


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting players schema downgrade"})

    if "players" not in inspector.get_table_names():
        logger.info({"message": "Players table missing during downgrade; nothing to do"})
        return

    pk = inspector.get_pk_constraint("players") or {}
    if pk.get("constrained_columns") == ["id"]:
        logger.info({"message": "Dropping players primary key"})
        op.drop_constraint(pk.get("name") or "pk_players", "players", type_="primary")

    columns = {column["name"]: column for column in inspector.get_columns("players")}
    downgrade_specs = {
        "stats_json": {"type": sa.String(), "using": "stats_json::text"},
        "rating": {"type": sa.String(), "using": "rating::text"},
        "market_value": {"type": sa.String(), "using": "market_value::text"},
        "height_cm": {"type": sa.String(), "using": "height_cm::text"},
        "weight_kg": {"type": sa.String(), "using": "weight_kg::text"},
        "country_code": {"type": sa.String(length=10), "using": "country_code::text"},
        "foot": {"type": sa.String(), "using": "foot::text"},
        "classification": {"type": sa.String(), "using": "classification::text"},
        "date_of_birth": {"type": sa.String(), "using": "date_of_birth::text"},
        "id": {"type": sa.String(), "using": "id::text"},
    }

    for column_name, spec in downgrade_specs.items():
        if column_name not in columns:
            continue
        target_type = spec["type"]
        if _column_type_matches(columns[column_name]["type"], target_type):
            continue
        logger.warning(
            {
                "message": "Reverting players column type during downgrade",
                "column_name": column_name,
                "current_type": str(columns[column_name]["type"]),
                "target_type": str(target_type),
            }
        )
        op.alter_column(
            "players",
            column_name,
            existing_type=columns[column_name]["type"],
            type_=target_type,
            postgresql_using=spec["using"],
        )

    logger.info({"message": "Completed players schema downgrade"})
