"""match status enum and matchday stats constraints

Revision ID: b1d0a7c5e9f2
Revises: a7b9c2d4e6f1
Create Date: 2026-06-07 21:30:00.000000
"""

from __future__ import annotations

import json
import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from db.models.matchday_stats import MATCHDAY_STATS_DEFAULT_STATISTICS, MatchdayStats

# revision identifiers, used by Alembic.
revision = "b1d0a7c5e9f2"
down_revision = "a7b9c2d4e6f1"
branch_labels = None
depends_on = None

logger = logging.getLogger(__name__)

MATCH_STATUS_ENUM_NAME = "match_status"
MATCH_STATUS_VALUES = ["scheduled", "live", "completed"]
MATCHDAY_STATS_TABLE_NAME = "matchday_stats"
MATCHES_TABLE_NAME = "matches"
MATCHDAY_STATS_JSONB_TYPE = postgresql.JSONB(astext_type=sa.Text())
MATCHDAY_STATS_DEFAULT_JSON = dict(MATCHDAY_STATS_DEFAULT_STATISTICS)
MATCHDAY_STATS_DEFAULT_SQL = f"""'{json.dumps(MATCHDAY_STATS_DEFAULT_JSON)}'::jsonb"""

MATCH_STATUS_ENUM = sa.Enum(*MATCH_STATUS_VALUES, name=MATCH_STATUS_ENUM_NAME)

EXPECTED_MATCHDAY_STATS_COLUMNS = {
    "id": {"type": sa.BigInteger(), "nullable": False},
    "player_id": {"type": sa.BigInteger(), "nullable": True},
    "match_id": {"type": sa.BigInteger(), "nullable": True},
    "match_date": {"type": sa.DateTime(), "nullable": True},
    "statistics": {"type": MATCHDAY_STATS_JSONB_TYPE, "nullable": True},
}

EXPECTED_MATCH_COLUMNS = {
    "status": {"type": MATCH_STATUS_ENUM, "nullable": True},
    "sofascore_id": {"type": sa.BigInteger(), "nullable": True},
}

EXPECTED_MATCHDAY_STATS_INDEXES = {
    "ix_matchday_stats_player_id",
    "ix_matchday_stats_match_date",
    "ix_matchday_stats_match_id",
    "ix_matchday_stats_statistics_rating",
    "ix_matchday_stats_statistics_goal_contributions",
    "ix_matchday_stats_statistics_pass_accuracy",
}

OBSOLETE_MATCHDAY_STATS_INDEXES = {
    "ix_matchday_stats_statistics_goals",
    "ix_matchday_stats_statistics_field",
    "ix_matchday_stats_statistics_chances_created",
    "ix_matchday_stats_statistics_expected_goals",
    "ix_matchday_stats_statistics_assists",
}

EXPECTED_MATCHDAY_STATS_FOREIGN_KEYS = {
    "fk_matchday_stats_player_id_players",
    "fk_matchday_stats_match_id_matches_sofascore_id",
}


def _column_type_matches(actual_type: sa.types.TypeEngine, expected_type: sa.types.TypeEngine) -> bool:
    logger.info(
        {
            "message": "Comparing matchday schema column type",
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

    if isinstance(expected_type, sa.Enum):
        return isinstance(actual_type, postgresql.ENUM) and list(getattr(actual_type, "enums", [])) == MATCH_STATUS_VALUES

    return isinstance(actual_type, expected_type.__class__)


def _build_schema_report(inspector: sa.engine.reflection.Inspector) -> dict:
    logger.info({"message": "Building matchday schema report"})
    tables = inspector.get_table_names()

    matchday_stats_columns = {}
    matchday_stats_missing_columns = list(EXPECTED_MATCHDAY_STATS_COLUMNS.keys())
    matchday_stats_mismatched_columns = {}
    matchday_stats_indexes = []
    matchday_stats_foreign_keys = []
    matchday_stats_statistics_default = None
    if MATCHDAY_STATS_TABLE_NAME in tables:
        matchday_stats_columns = {column["name"]: column for column in inspector.get_columns(MATCHDAY_STATS_TABLE_NAME)}
        matchday_stats_missing_columns = [
            column_name for column_name in EXPECTED_MATCHDAY_STATS_COLUMNS if column_name not in matchday_stats_columns
        ]
        for column_name, spec in EXPECTED_MATCHDAY_STATS_COLUMNS.items():
            if column_name not in matchday_stats_columns:
                continue
            if not _column_type_matches(matchday_stats_columns[column_name]["type"], spec["type"]):
                matchday_stats_mismatched_columns[column_name] = {
                    "current_type": str(matchday_stats_columns[column_name]["type"]),
                    "expected_type": str(spec["type"]),
                }
        matchday_stats_indexes = inspector.get_indexes(MATCHDAY_STATS_TABLE_NAME)
        matchday_stats_foreign_keys = inspector.get_foreign_keys(MATCHDAY_STATS_TABLE_NAME)
        matchday_stats_statistics_default = matchday_stats_columns.get("statistics", {}).get("default")

    match_columns = {}
    missing_match_columns = list(EXPECTED_MATCH_COLUMNS.keys())
    mismatched_match_columns = {}
    matches_unique_constraints = []
    if MATCHES_TABLE_NAME in tables:
        match_columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
        missing_match_columns = [column_name for column_name in EXPECTED_MATCH_COLUMNS if column_name not in match_columns]
        for column_name, spec in EXPECTED_MATCH_COLUMNS.items():
            if column_name not in match_columns:
                continue
            if not _column_type_matches(match_columns[column_name]["type"], spec["type"]):
                mismatched_match_columns[column_name] = {
                    "current_type": str(match_columns[column_name]["type"]),
                    "expected_type": str(spec["type"]),
                }
        matches_unique_constraints = inspector.get_unique_constraints(MATCHES_TABLE_NAME)

    match_enums = inspector.get_enums() if hasattr(inspector, "get_enums") else []
    report = {
        "match_status_enum_exists": MATCH_STATUS_ENUM_NAME in {enum.get("name") for enum in match_enums},
        "matches_status_type_is_enum": MATCHES_TABLE_NAME in tables
        and "status" in match_columns
        and _column_type_matches(match_columns["status"]["type"], EXPECTED_MATCH_COLUMNS["status"]["type"]),
        "matches_sofascore_id_unique": any(
            any(column == "sofascore_id" for column in constraint.get("column_names", []))
            for constraint in matches_unique_constraints
        ),
        "matchday_stats_table_exists": MATCHDAY_STATS_TABLE_NAME in tables,
        "matchday_stats_primary_key": inspector.get_pk_constraint(MATCHDAY_STATS_TABLE_NAME).get("constrained_columns")
        if MATCHDAY_STATS_TABLE_NAME in tables
        else None,
        "matchday_stats_missing_columns": matchday_stats_missing_columns,
        "matchday_stats_mismatched_columns": matchday_stats_mismatched_columns,
        "matchday_stats_index_names": {index.get("name") for index in matchday_stats_indexes},
        "matchday_stats_foreign_key_names": {fk.get("name") for fk in matchday_stats_foreign_keys},
        "matchday_stats_statistics_default": matchday_stats_statistics_default,
        "matchday_stats_statistics_default_matches": _parse_jsonb_default_expression(
            matchday_stats_statistics_default
        )
        == MATCHDAY_STATS_DEFAULT_JSON,
        "missing_match_columns": missing_match_columns,
        "mismatched_match_columns": mismatched_match_columns,
    }
    logger.info({"message": "Matchday schema report complete", "report": report})
    return report


def _matchday_feature_schema_report(inspector: sa.engine.reflection.Inspector) -> dict:
    logger.info({"message": "Building legacy matchday feature schema report"})
    return _build_schema_report(inspector)


def _match_status_using_expression(column_name: str) -> str:
    logger.info({"message": "Building match status cast expression", "column_name": column_name})
    lower_value = f"lower(coalesce({column_name}::text, ''))"
    return f"""
        CASE
            WHEN {lower_value} IN ('live', 'inprogress', 'in_progress', 'ongoing', 'halftime', 'half time') THEN 'live'
            WHEN {lower_value} IN ('completed', 'finished', 'full time', 'ft', 'ended', 'final') THEN 'completed'
            ELSE 'scheduled'
        END::{MATCH_STATUS_ENUM_NAME}
    """


def _safe_bigint_using(column_name: str) -> str:
    logger.info({"message": "Building safe bigint cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::bigint"


def _safe_timestamp_using(column_name: str) -> str:
    logger.info({"message": "Building safe timestamp cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::timestamp without time zone"


def _safe_jsonb_using(column_name: str) -> str:
    logger.info({"message": "Building safe jsonb cast expression", "column_name": column_name})
    return f"NULLIF({column_name}::text, '')::jsonb"


def _parse_jsonb_default_expression(default_expression: object) -> dict | None:
    logger.info(
        {
            "message": "Parsing jsonb default expression",
            "default_expression": str(default_expression),
        }
    )
    if default_expression is None:
        return None

    default_text = str(default_expression).strip()
    if default_text.endswith("::jsonb"):
        default_text = default_text[:-7].strip()

    if default_text.startswith("'") and default_text.endswith("'"):
        default_text = default_text[1:-1]

    try:
        parsed_default = json.loads(default_text)
    except json.JSONDecodeError as exc:
        logger.warning(
            {
                "message": "Failed to parse jsonb default expression",
                "default_expression": str(default_expression),
                "error": {"message": str(exc), "type": type(exc).__name__},
            }
        )
        return None

    if not isinstance(parsed_default, dict):
        logger.warning(
            {
                "message": "Parsed jsonb default expression was not a dict",
                "default_expression": str(default_expression),
                "parsed_type": type(parsed_default).__name__,
            }
        )
        return None

    logger.info(
        {
            "message": "Parsed jsonb default expression successfully",
            "keys": sorted(parsed_default.keys()),
        }
    )
    return parsed_default


def _ensure_match_status_enum(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHES_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping match status enum repair because matches table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
    if "status" not in columns:
        logger.warning({"message": "Adding missing matches.status column"})
        op.add_column(MATCHES_TABLE_NAME, sa.Column("status", MATCH_STATUS_ENUM, nullable=True))
        return

    current_type = columns["status"]["type"]
    if _column_type_matches(current_type, EXPECTED_MATCH_COLUMNS["status"]["type"]):
        logger.info({"message": "matches.status column already matches enum schema"})
        return

    logger.warning(
        {
            "message": "Repairing matches.status column type",
            "current_type": str(current_type),
            "expected_type": str(EXPECTED_MATCH_COLUMNS["status"]["type"]),
        }
    )
    MATCH_STATUS_ENUM.create(bind, checkfirst=True)
    op.alter_column(
        MATCHES_TABLE_NAME,
        "status",
        existing_type=current_type,
        type_=MATCH_STATUS_ENUM,
        existing_nullable=columns["status"].get("nullable", True),
        postgresql_using=_match_status_using_expression("status"),
    )


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

    unique_constraints = inspector.get_unique_constraints(MATCHES_TABLE_NAME)
    if any(any(column == "sofascore_id" for column in constraint.get("column_names", [])) for constraint in unique_constraints):
        logger.info({"message": "matches.sofascore_id unique constraint already exists"})
        return

    duplicate_count = bind.execute(
        sa.text(
            """
            SELECT COUNT(*) FROM (
                SELECT sofascore_id
                FROM matches
                WHERE sofascore_id IS NOT NULL
                GROUP BY sofascore_id
                HAVING COUNT(*) > 1
            ) duplicate_ids
            """
        )
    ).scalar_one()

    if duplicate_count:
        logger.error({
            "message": "Cannot add unique constraint to matches.sofascore_id because duplicates exist",
            "duplicate_count": int(duplicate_count),
        })
        raise RuntimeError("Cannot create unique constraint on matches.sofascore_id until duplicates are removed")

    logger.info({"message": "Creating unique constraint for matches.sofascore_id"})
    op.create_unique_constraint("uq_matches_sofascore_id", MATCHES_TABLE_NAME, ["sofascore_id"])
    logger.info({"message": "Created unique constraint for matches.sofascore_id"})


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


def _ensure_matchday_stats_id_default(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHDAY_STATS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matchday_stats id default repair because table is missing"})
        return

    logger.info({"message": "Ensuring matchday_stats id sequence and default"})
    bind.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS matchday_stats_id_seq"))
    bind.execute(sa.text("ALTER SEQUENCE matchday_stats_id_seq OWNED BY matchday_stats.id"))
    op.alter_column(
        MATCHDAY_STATS_TABLE_NAME,
        "id",
        existing_type=sa.BigInteger(),
        server_default=sa.text("nextval('matchday_stats_id_seq'::regclass)"),
    )
    bind.execute(
        sa.text(
            """
            SELECT setval(
                'matchday_stats_id_seq',
                COALESCE((SELECT MAX(id) FROM matchday_stats), 0) + 1,
                false
            )
            """
        )
    )


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


def _ensure_matchday_stats_foreign_keys(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHDAY_STATS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matchday_stats foreign key repair because table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHDAY_STATS_TABLE_NAME)}
    foreign_keys = inspector.get_foreign_keys(MATCHDAY_STATS_TABLE_NAME)
    existing_fk_names = {fk.get("name") for fk in foreign_keys}

    if "player_id" in columns and "fk_matchday_stats_player_id_players" not in existing_fk_names:
        orphan_count = bind.execute(
            sa.text(
                """
                SELECT COUNT(*)
                FROM matchday_stats ms
                LEFT JOIN players p ON p.id = ms.player_id
                WHERE ms.player_id IS NOT NULL AND p.id IS NULL
                """
            )
        ).scalar_one()
        if orphan_count:
            logger.error({
                "message": "Cannot add matchday_stats.player_id foreign key because orphans exist",
                "orphan_count": int(orphan_count),
            })
            raise RuntimeError("Cannot add matchday_stats.player_id foreign key until orphans are removed")
        logger.info({"message": "Creating matchday_stats.player_id foreign key"})
        op.create_foreign_key(
            "fk_matchday_stats_player_id_players",
            MATCHDAY_STATS_TABLE_NAME,
            "players",
            ["player_id"],
            ["id"],
        )

    if "match_id" in columns and "fk_matchday_stats_match_id_matches_sofascore_id" not in existing_fk_names:
        orphan_count = bind.execute(
            sa.text(
                """
                SELECT COUNT(*)
                FROM matchday_stats ms
                LEFT JOIN matches m ON m.sofascore_id = ms.match_id
                WHERE ms.match_id IS NOT NULL AND m.sofascore_id IS NULL
                """
            )
        ).scalar_one()
        if orphan_count:
            logger.error({
                "message": "Cannot add matchday_stats.match_id foreign key because orphans exist",
                "orphan_count": int(orphan_count),
            })
            raise RuntimeError("Cannot add matchday_stats.match_id foreign key until orphans are removed")
        logger.info({"message": "Creating matchday_stats.match_id foreign key"})
        op.create_foreign_key(
            "fk_matchday_stats_match_id_matches_sofascore_id",
            MATCHDAY_STATS_TABLE_NAME,
            "matches",
            ["match_id"],
            ["sofascore_id"],
        )


def _ensure_matchday_stats_indexes(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHDAY_STATS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matchday_stats index repair because table is missing"})
        return

    existing_index_names = {index.get("name") for index in inspector.get_indexes(MATCHDAY_STATS_TABLE_NAME)}
    for obsolete_index_name in OBSOLETE_MATCHDAY_STATS_INDEXES:
        if obsolete_index_name not in existing_index_names:
            continue
        logger.info(
            {
                "message": "Dropping obsolete matchday_stats index",
                "index_name": obsolete_index_name,
            }
        )
        op.drop_index(obsolete_index_name, table_name=MATCHDAY_STATS_TABLE_NAME)
        existing_index_names.discard(obsolete_index_name)

    index_expressions = {
        "ix_matchday_stats_player_id": MatchdayStats.__table__.c.player_id,
        "ix_matchday_stats_match_date": MatchdayStats.__table__.c.match_date,
        "ix_matchday_stats_match_id": MatchdayStats.__table__.c.match_id,
        "ix_matchday_stats_statistics_rating": MatchdayStats.__table__.c.statistics["rating"].astext.cast(sa.Float()),
        "ix_matchday_stats_statistics_goal_contributions": MatchdayStats.__table__.c.statistics[
            "goal_contributions"
        ].astext.cast(sa.Integer()),
        "ix_matchday_stats_statistics_pass_accuracy": MatchdayStats.__table__.c.statistics["pass_accuracy"].astext.cast(
            sa.Integer()
        ),
    }

    for index_name, expression in index_expressions.items():
        if index_name in existing_index_names:
            logger.info({"message": "matchday_stats index already exists", "index_name": index_name})
            continue
        logger.info({"message": "Creating matchday_stats index", "index_name": index_name})
        sa.Index(index_name, expression).create(bind=bind)


def _ensure_matchday_stats_statistics_default(bind: sa.engine.Connection) -> None:
    inspector = sa.inspect(bind)
    if MATCHDAY_STATS_TABLE_NAME not in inspector.get_table_names():
        logger.info({"message": "Skipping matchday_stats statistics default repair because table is missing"})
        return

    columns = {column["name"]: column for column in inspector.get_columns(MATCHDAY_STATS_TABLE_NAME)}
    current_default = columns.get("statistics", {}).get("default")
    if current_default and MATCHDAY_STATS_DEFAULT_SQL in str(current_default):
        logger.info({"message": "matchday_stats.statistics default already matches schema"})
        return

    logger.info({"message": "Setting matchday_stats.statistics default"})
    op.alter_column(
        MATCHDAY_STATS_TABLE_NAME,
        "statistics",
        existing_type=MATCHDAY_STATS_JSONB_TYPE,
        server_default=sa.text(MATCHDAY_STATS_DEFAULT_SQL),
    )


def verify_matchday_feature_schema(bind: sa.engine.Connection) -> None:
    logger.info({"message": "Verifying matchday feature schema after repair"})
    report = _build_schema_report(sa.inspect(bind))
    if (
        report["match_status_enum_exists"]
        and report["matches_status_type_is_enum"]
        and report["matches_sofascore_id_unique"]
        and report["matchday_stats_table_exists"]
        and report["matchday_stats_primary_key"] == ["id"]
        and not report["matchday_stats_missing_columns"]
        and not report["matchday_stats_mismatched_columns"]
        and EXPECTED_MATCHDAY_STATS_FOREIGN_KEYS.issubset(report["matchday_stats_foreign_key_names"])
        and EXPECTED_MATCHDAY_STATS_INDEXES.issubset(report["matchday_stats_index_names"])
        and report["matchday_stats_statistics_default_matches"]
        and not report["missing_match_columns"]
        and not report["mismatched_match_columns"]
    ):
        logger.info({"message": "Matchday feature schema verification passed"})
        return

    logger.error({"message": "Matchday feature schema verification failed", "report": report})
    raise RuntimeError(f"Matchday feature schema verification failed: {report}")


def upgrade() -> None:
    bind = op.get_bind()
    logger.info({"message": "Starting matchday feature schema migration"})
    _ensure_match_status_enum(bind)
    _ensure_matches_sofascore_id(bind)
    _ensure_matchday_stats_table(bind)
    _ensure_matchday_stats_primary_key(bind)
    _ensure_matchday_stats_columns(bind)
    _ensure_matchday_stats_id_default(bind)
    _ensure_matchday_stats_foreign_keys(bind)
    _ensure_matchday_stats_statistics_default(bind)
    _ensure_matchday_stats_indexes(bind)
    verify_matchday_feature_schema(bind)
    logger.info({"message": "Completed matchday feature schema migration"})


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    logger.info({"message": "Starting matchday feature schema downgrade"})

    if MATCHDAY_STATS_TABLE_NAME in inspector.get_table_names():
        indexes = inspector.get_indexes(MATCHDAY_STATS_TABLE_NAME)
        for index_name in EXPECTED_MATCHDAY_STATS_INDEXES:
            if any(index.get("name") == index_name for index in indexes):
                logger.info({"message": "Dropping matchday_stats index", "index_name": index_name})
                op.drop_index(index_name, table_name=MATCHDAY_STATS_TABLE_NAME)

        foreign_keys = inspector.get_foreign_keys(MATCHDAY_STATS_TABLE_NAME)
        if any(fk.get("name") == "fk_matchday_stats_player_id_players" for fk in foreign_keys):
            logger.info({"message": "Dropping matchday_stats.player_id foreign key"})
            op.drop_constraint("fk_matchday_stats_player_id_players", MATCHDAY_STATS_TABLE_NAME, type_="foreignkey")
        if any(fk.get("name") == "fk_matchday_stats_match_id_matches_sofascore_id" for fk in foreign_keys):
            logger.info({"message": "Dropping matchday_stats.match_id foreign key"})
            op.drop_constraint("fk_matchday_stats_match_id_matches_sofascore_id", MATCHDAY_STATS_TABLE_NAME, type_="foreignkey")

        logger.info({"message": "Dropping matchday_stats table"})
        op.drop_table(MATCHDAY_STATS_TABLE_NAME)

    if MATCHES_TABLE_NAME in inspector.get_table_names():
        unique_constraints = inspector.get_unique_constraints(MATCHES_TABLE_NAME)
        if any(any(column == "sofascore_id" for column in constraint.get("column_names", [])) for constraint in unique_constraints):
            logger.info({"message": "Dropping matches.sofascore_id unique constraint"})
            op.drop_constraint("uq_matches_sofascore_id", MATCHES_TABLE_NAME, type_="unique")

        columns = {column["name"]: column for column in inspector.get_columns(MATCHES_TABLE_NAME)}
        if "status" in columns:
            logger.info({"message": "Converting matches.status back to string"})
            op.alter_column(
                MATCHES_TABLE_NAME,
                "status",
                existing_type=MATCH_STATUS_ENUM,
                type_=sa.String(),
                existing_nullable=columns["status"].get("nullable", True),
                postgresql_using="status::text",
            )

    logger.info({"message": "Completed matchday feature schema downgrade"})
