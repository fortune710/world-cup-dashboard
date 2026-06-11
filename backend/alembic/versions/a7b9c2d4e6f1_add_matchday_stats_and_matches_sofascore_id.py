"""add matchday stats and matches sofascore id

Revision ID: a7b9c2d4e6f1
Revises: 4c6d8f2a91b7
Create Date: 2026-06-07 14:30:00.000000
"""

from __future__ import annotations

import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from db.models.matchday_stats import MatchdayStats

# revision identifiers, used by Alembic.
revision = "a7b9c2d4e6f1"
down_revision = "4c6d8f2a91b7"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

MATCHDAY_STATS_TABLE_NAME = "matchday_stats"
MATCHES_TABLE_NAME = "matches"
MATCHES_SOFASCORE_ID_INDEX_NAME = "ix_matches_sofascore_id"
MATCHDAY_STATS_JSONB_TYPE = postgresql.JSONB(astext_type=sa.Text())

EXPECTED_MATCHDAY_STATS_COLUMNS = {
    "id": {"type": sa.BigInteger(), "nullable": False},
    "player_id": {"type": sa.BigInteger(), "nullable": True},
    "match_id": {"type": sa.BigInteger(), "nullable": True},
    "match_date": {"type": sa.DateTime(), "nullable": True},
    "statistics": {"type": MATCHDAY_STATS_JSONB_TYPE, "nullable": True},
}

EXPECTED_MATCH_COLUMNS = {
    "sofascore_id": {"type": sa.BigInteger(), "nullable": True},
}


def _column_type_matches(actual_type: sa.types.TypeEngine, expected_type: sa.types.TypeEngine) -> bool:
    logger.info(
        {
            "message": "Comparing matchday feature column type",
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

    if isinstance(expected_type, postgresql.JSONB):
        return isinstance(actual_type, postgresql.JSONB)

    if isinstance(expected_type, sa.DateTime):
        return isinstance(actual_type, sa.DateTime)

    return isinstance(actual_type, expected_type.__class__)


def _matchday_feature_schema_report(inspector: sa.engine.reflection.Inspector) -> dict:
    logger.info({"message": "Building matchday feature schema report"})
    tables = inspector.get_table_names()

    matchday_stats_columns = {}
    matchday_stats_missing_columns = list(EXPECTED_MATCHDAY_STATS_COLUMNS.keys())
    matchday_stats_mismatched_columns = {}
    if MATCHDAY_STATS_TABLE_NAME in tables:
        matchday_stats_columns = {column["name"]: column for column in inspector.get_columns(MATCHDAY_STATS_TABLE_NAME)}
        matchday_stats_missing_columns = [
            column_name for column_name in EXPECTED_MATCHDAY_STATS_COLUMNS if column_name not in matchday_stats_columns
        ]
        matchday_stats_mismatched_columns = {}
        for column_name, spec in EXPECTED_MATCHDAY_STATS_COLUMNS.items():
            if column_name not in matchday_stats_columns:
                continue
            if not _column_type_matches(matchday_stats_columns[column_name]["type"], spec["type"]):
                matchday_stats_mismatched_columns[column_name] = {
                    "current_type": str(matchday_stats_columns[column_name]["type"]),
                    "expected_type": str(spec["type"]),
                }

    match_columns = {}
    missing_match_columns = list(EXPECTED_MATCH_COLUMNS.keys())
    mismatched_match_columns = {}
    matches_indexes = []
    if MATCHES_TABLE_NAME in tables:
        match_columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
        missing_match_columns = [column_name for column_name in EXPECTED_MATCH_COLUMNS if column_name not in match_columns]
        mismatched_match_columns = {}
        for column_name, spec in EXPECTED_MATCH_COLUMNS.items():
            if column_name not in match_columns:
                continue
            if not _column_type_matches(match_columns[column_name]["type"], spec["type"]):
                mismatched_match_columns[column_name] = {
                    "current_type": str(match_columns[column_name]["type"]),
                    "expected_type": str(spec["type"]),
                }
        matches_indexes = inspector.get_indexes(MATCHES_TABLE_NAME)

    matchday_report = {
        "matchday_stats_table_exists": MATCHDAY_STATS_TABLE_NAME in tables,
        "matchday_stats_primary_key": inspector.get_pk_constraint(MATCHDAY_STATS_TABLE_NAME).get("constrained_columns")
        if MATCHDAY_STATS_TABLE_NAME in tables
        else None,
        "matchday_stats_missing_columns": matchday_stats_missing_columns,
        "matchday_stats_mismatched_columns": matchday_stats_mismatched_columns,
        "missing_match_columns": missing_match_columns,
        "mismatched_match_columns": mismatched_match_columns,
        "matches_sofascore_id_index_exists": any(
            index.get("name") == MATCHES_SOFASCORE_ID_INDEX_NAME for index in matches_indexes
        ),
    }
    logger.info({"message": "Matchday feature schema report complete", "report": matchday_report})
    return matchday_report


def _safe_bigint_using(column_name: str) -> str:
    logger.info({"message": "Building safe bigint cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::bigint"


def _safe_timestamp_using(column_name: str) -> str:
    logger.info({"message": "Building safe timestamp cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::timestamp without time zone"


def _safe_jsonb_using(column_name: str) -> str:
    logger.info({"message": "Building safe jsonb cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::jsonb"


def _ensure_matchday_stats_table(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHDAY_STATS_TABLE_NAME in inspector.get_table_names():
        logger.info({"message": "matchday_stats table already exists"})
        return

    logger.info({"message": "matchday_stats table missing; creating current schema"})
    op.create_table(
        MATCHDAY_STATS_TABLE_NAME,
        *[column.copy() for column in MatchdayStats.__table__.columns],
        sa.PrimaryKeyConstraint("id", name="pk_matchday_stats"),
    )
    logger.info({"message": "matchday_stats table created"})


def _ensure_matchday_stats_primary_key(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHDAY_STATS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matchday_stats primary key repair because table is missing"})
        return

    pk = inspector.get_pk_constraint(MATCHDAY_STATS_TABLE_NAME) or {}
    if pk.get("constrained_columns") == ["id"]:
        logger.info({"message": "matchday_stats primary key already matches schema"})
        return

    logger.warning({"message": "Repairing matchday_stats primary key", "primary_key": pk.get("constrained_columns")})
    null_count = bind.execute(sa.text("SELECT COUNT(*) FROM matchday_stats WHERE id IS NULL")).scalar_one()
    duplicate_count = bind.execute(
        sa.text(
            """
            SELECT COUNT(*) FROM (
                SELECT id
                FROM matchday_stats
                GROUP BY id
                HAVING COUNT(*) > 1
            ) duplicate_ids
            """
        )
    ).scalar_one()

    if null_count or duplicate_count:
        logger.error(
            {
                "message": "Cannot repair matchday_stats primary key because duplicate or null ids exist",
                "null_id_count": int(null_count or 0),
                "duplicate_id_count": int(duplicate_count or 0),
            }
        )
        raise RuntimeError("Cannot create a primary key on matchday_stats.id until duplicate or null ids are removed")

    columns = {column["name"] for column in inspector.get_columns(MATCHDAY_STATS_TABLE_NAME)}
    if "id" in columns:
        logger.info({"message": "Ensuring matchday_stats.id is not nullable before adding primary key"})
        op.alter_column(
            MATCHDAY_STATS_TABLE_NAME,
            "id",
            existing_type=sa.BigInteger(),
            nullable=False,
        )

    op.create_primary_key("pk_matchday_stats", MATCHDAY_STATS_TABLE_NAME, ["id"])
    logger.info({"message": "matchday_stats primary key repaired"})


def _ensure_matchday_stats_columns(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHDAY_STATS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matchday_stats column repair because table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHDAY_STATS_TABLE_NAME)}
    for column_name, spec in EXPECTED_MATCHDAY_STATS_COLUMNS.items():
        if column_name not in columns:
            logger.warning(
                {
                    "message": "matchday_stats column missing during repair",
                    "column_name": column_name,
                }
            )
            op.add_column(
                MATCHDAY_STATS_TABLE_NAME,
                sa.Column(column_name, spec["type"], nullable=spec["nullable"]),
            )
            continue

        current_type = columns[column_name]["type"]
        if _column_type_matches(current_type, spec["type"]):
            logger.info(
                {
                    "message": "matchday_stats column type already matches",
                    "column_name": column_name,
                    "current_type": str(current_type),
                }
            )
            continue

        logger.warning(
            {
                "message": "Repairing matchday_stats column type",
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
        if column_name == "id":
            alter_kwargs["postgresql_using"] = _safe_bigint_using(column_name)
        elif column_name in {"player_id", "match_id"}:
            alter_kwargs["postgresql_using"] = _safe_bigint_using(column_name)
        elif column_name == "match_date":
            alter_kwargs["postgresql_using"] = _safe_timestamp_using(column_name)
        elif column_name == "statistics":
            alter_kwargs["postgresql_using"] = _safe_jsonb_using(column_name)
        op.alter_column(MATCHDAY_STATS_TABLE_NAME, column_name, **alter_kwargs)

    logger.info({"message": "matchday_stats column repair complete"})


def _ensure_matches_sofascore_id(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHES_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matches.sofascore_id repair because matches table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
    if "sofascore_id" not in columns:
        logger.warning({"message": "Adding missing matches.sofascore_id column"})
        op.add_column(
            MATCHES_TABLE_NAME,
            sa.Column("sofascore_id", sa.BigInteger(), nullable=True),
        )
    elif not _column_type_matches(columns["sofascore_id"]["type"], EXPECTED_MATCH_COLUMNS["sofascore_id"]["type"]):
        logger.warning(
            {
                "message": "Repairing matches.sofascore_id column type",
                "current_type": str(columns["sofascore_id"]["type"]),
                "expected_type": str(EXPECTED_MATCH_COLUMNS["sofascore_id"]["type"]),
            }
        )
        op.alter_column(
            MATCHES_TABLE_NAME,
            "sofascore_id",
            existing_type=columns["sofascore_id"]["type"],
            type_=EXPECTED_MATCH_COLUMNS["sofascore_id"]["type"],
            existing_nullable=columns["sofascore_id"].get("nullable", True),
            postgresql_using=_safe_bigint_using("sofascore_id"),
        )
    else:
        logger.info({"message": "matches.sofascore_id column already matches schema"})

    indexes = inspector.get_indexes(MATCHES_TABLE_NAME)
    if any(index.get("name") == MATCHES_SOFASCORE_ID_INDEX_NAME for index in indexes):
        logger.info({"message": "matches.sofascore_id index already exists"})
        return

    logger.info({"message": "Creating matches.sofascore_id index"})
    op.create_index(MATCHES_SOFASCORE_ID_INDEX_NAME, MATCHES_TABLE_NAME, ["sofascore_id"], unique=False)
    logger.info({"message": "matches.sofascore_id index created"})


def verify_matchday_feature_schema(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Verifying matchday feature schema after repair"})
    report = _matchday_feature_schema_report(sa.inspect(bind))
    if (
        report["matchday_stats_table_exists"]
        and report["matchday_stats_primary_key"] == ["id"]
        and not report["matchday_stats_missing_columns"]
        and not report["matchday_stats_mismatched_columns"]
        and not report["missing_match_columns"]
        and not report["mismatched_match_columns"]
        and report["matches_sofascore_id_index_exists"]
    ):
        logger.info({"message": "Matchday feature schema verification passed"})
        return

    logger.error({"message": "Matchday feature schema verification failed", "report": report})
    raise RuntimeError(f"Matchday feature schema verification failed: {report}")


def upgrade() -> None:
    bind = op.get_bind()
    logger.info({"message": "Starting matchday feature schema migration"})
    _ensure_matchday_stats_table(bind)
    _ensure_matchday_stats_primary_key(bind)
    _ensure_matchday_stats_columns(bind)
    _ensure_matches_sofascore_id(bind)
    verify_matchday_feature_schema(bind)
    logger.info({"message": "Completed matchday feature schema migration"})


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting matchday feature schema downgrade"})

    if MATCHDAY_STATS_TABLE_NAME in inspector.get_table_names():
        logger.info({"message": "Dropping matchday_stats table"})
        op.drop_table(MATCHDAY_STATS_TABLE_NAME)

    if MATCHES_TABLE_NAME in inspector.get_table_names():
        columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
        if "sofascore_id" in columns:
            indexes = inspector.get_indexes(MATCHES_TABLE_NAME)
            if any(index.get("name") == MATCHES_SOFASCORE_ID_INDEX_NAME for index in indexes):
                logger.info({"message": "Dropping matches.sofascore_id index"})
                op.drop_index(MATCHES_SOFASCORE_ID_INDEX_NAME, table_name=MATCHES_TABLE_NAME)

            logger.info({"message": "Dropping matches.sofascore_id column"})
            op.drop_column(MATCHES_TABLE_NAME, "sofascore_id")

    logger.info({"message": "Completed matchday feature schema downgrade"})
