import logging
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import Float, Integer, func, text
from sqlalchemy.orm import Session, joinedload

from db.models.matchday_stats import MatchdayStats
from db.models.matches import Match, MatchStatus
from db.models.players import Player

logger = logging.getLogger(__name__)

MATCHDAY_STAT_LEADER_SPECS = (
    ("rating", MatchdayStats.statistics["rating"].astext.cast(Float)),
    (
        "goal_contributions",
        MatchdayStats.statistics["goal_contributions"].astext.cast(Integer),
    ),
    ("pass_accuracy", MatchdayStats.statistics["pass_accuracy"].astext.cast(Integer)),
)

def upsert_match(db: Session, match_data: dict):
    # Handle datetime conversion if it's a string
    if isinstance(match_data.get('kickoff_utc'), str):
        match_data['kickoff_utc'] = datetime.fromisoformat(match_data['kickoff_utc'].replace('Z', '+00:00'))

    db_match = db.query(Match).filter(Match.id == match_data['id']).first()
    if db_match:
        for key, value in match_data.items():
            setattr(db_match, key, value)
    else:
        db_match = Match(**match_data)
        db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

def get_all_matches(db: Session, status: str = None, page: int = 1, page_size: int = 5):
    skip = (page - 1) * page_size
    query = db.query(Match).options(
        joinedload(Match.home_team),
        joinedload(Match.away_team)
    ).order_by(Match.kickoff_utc.asc())
    
    if status:
        query = query.filter(Match.status == status)
        
    return query.offset(skip).limit(page_size).all()


def get_match_by_fixture_identity(db: Session, match_identity: dict):
    logger.info({
        "message": "Looking up match by fixture identity",
        "home_team_code": match_identity.get("home_team_code"),
        "away_team_code": match_identity.get("away_team_code"),
        "kickoff_utc": match_identity.get("kickoff_utc"),
    })
    try:
        query = db.query(Match)

        if match_identity.get("home_team_code"):
            query = query.filter(Match.home_team_code == match_identity["home_team_code"])
        if match_identity.get("away_team_code"):
            query = query.filter(Match.away_team_code == match_identity["away_team_code"])
        
        ## Temporarily disabling kickoff_utc filter due to DB type mismatch (VARCHAR vs TIMESTAMP)
        # if match_identity.get("kickoff_utc") is not None:
        #     kickoff_utc = match_identity["kickoff_utc"]
        #     if isinstance(kickoff_utc, datetime) and kickoff_utc.tzinfo is not None:
        #         kickoff_utc = kickoff_utc.astimezone(timezone.utc).replace(tzinfo=None)
        #     query = query.filter(Match.kickoff_utc == kickoff_utc)

        db_match = query.first()
        if db_match:
            logger.info({
                "message": "Resolved match by fixture identity",
                "match_id": db_match.id,
                "home_team_code": db_match.home_team_code,
                "away_team_code": db_match.away_team_code,
                "kickoff_utc": db_match.kickoff_utc,
            })
        else:
            logger.warning({
                "message": "No match found for fixture identity",
                "home_team_code": match_identity.get("home_team_code"),
                "away_team_code": match_identity.get("away_team_code"),
                "kickoff_utc": match_identity.get("kickoff_utc"),
            })
        return db_match
    except Exception as exc:
        logger.error({
            "message": "Failed to look up match by fixture identity",
            "error": {"message": str(exc), "type": type(exc).__name__},
            "home_team_code": match_identity.get("home_team_code"),
            "away_team_code": match_identity.get("away_team_code"),
            "kickoff_utc": match_identity.get("kickoff_utc"),
        })
        raise


def update_match_sofascore_id(db: Session, match_identity: dict):
    logger.info({
        "message": "Starting match sofascore id update",
        "sofascore_id": match_identity.get("sofascore_id"),
        "home_team_code": match_identity.get("home_team_code"),
        "away_team_code": match_identity.get("away_team_code"),
    })
    try:
        db_match = get_match_by_fixture_identity(db, match_identity)
        if not db_match:
            return None

        sofascore_id = match_identity.get("sofascore_id")
        if sofascore_id is None:
            logger.warning({
                "message": "Skipping match update because sofascore_id is missing",
                "match_id": db_match.id,
                "home_team_code": db_match.home_team_code,
                "away_team_code": db_match.away_team_code,
                "kickoff_utc": db_match.kickoff_utc,
            })
            return None

        db.execute(
            text("UPDATE matches SET sofascore_id = :sofascore_id WHERE id = :match_id"),
            {"sofascore_id": sofascore_id, "match_id": db_match.id},
        )
        db.commit()
        logger.info({
            "message": "Updated match sofascore id",
            "match_id": db_match.id,
            "sofascore_id": sofascore_id,
        })
        return db_match
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed to update match sofascore id",
            "error": {"message": str(exc), "type": type(exc).__name__},
            "sofascore_id": match_identity.get("sofascore_id"),
            "home_team_code": match_identity.get("home_team_code"),
            "away_team_code": match_identity.get("away_team_code"),
        })
        raise


def get_match_by_sofascore_id(db: Session, sofascore_id: int):
    logger.info({
        "message": "Looking up match by sofascore id",
        "sofascore_id": sofascore_id,
    })
    try:
        db_match = db.query(Match).filter(Match.sofascore_id == sofascore_id).first()
        if db_match:
            logger.info({
                "message": "Resolved match by sofascore id",
                "match_id": db_match.id,
                "sofascore_id": db_match.sofascore_id,
                "home_team_code": db_match.home_team_code,
                "away_team_code": db_match.away_team_code,
            })
        else:
            logger.warning({
                "message": "No match found for sofascore id",
                "sofascore_id": sofascore_id,
            })
        return db_match
    except Exception as exc:
        logger.error({
            "message": "Failed to look up match by sofascore id",
            "error": {"message": str(exc), "type": type(exc).__name__},
            "sofascore_id": sofascore_id,
        })
        raise


def get_matches_for_matchday_stats_queue(db: Session):
    logger.info({"message": "Looking up live and completed matches for matchday stats queue"})
    try:
        matches = (
            db.query(Match)
            .filter(Match.status.in_([MatchStatus.LIVE, MatchStatus.COMPLETED]))
            .filter(Match.sofascore_id.isnot(None))
            .order_by(Match.kickoff_utc.asc(), Match.id.asc())
            .all()
        )
        logger.info({
            "message": "Resolved matches for matchday stats queue",
            "count": len(matches),
        })
        return matches
    except Exception as exc:
        logger.error({
            "message": "Failed to look up matches for matchday stats queue",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def _coerce_matchday_stat_value(stat_name: str, raw_value: Any) -> int | float:
    logger.info(
        {
            "message": "Coercing matchday stat leader value",
            "stat_name": stat_name,
            "raw_value": raw_value,
        }
    )
    if stat_name == "rating":
        value = float(raw_value or 0)
    else:
        value = int(raw_value or 0)

    logger.info(
        {
            "message": "Coerced matchday stat leader value",
            "stat_name": stat_name,
            "value": value,
        }
    )
    return value


def _fetch_top_matchday_stat_leader(
    db: Session,
    match_date: date,
    stat_name: str,
    value_expression,
):
    logger.info(
        {
            "message": "Fetching top matchday stat leader",
            "stat_name": stat_name,
            "match_date": match_date.isoformat(),
        }
    )
    row = (
        db.query(
            Player.name.label("player_name"),
            value_expression.label("value"),
        )
        .join(MatchdayStats, Player.id == MatchdayStats.player_id)
        .filter(func.date(MatchdayStats.match_date) == match_date)
        .order_by(value_expression.desc(), Player.name.asc(), Player.id.asc())
        .limit(1)
        .first()
    )

    if row is None:
        logger.warning(
            {
                "message": "No matchday stat leader found for date",
                "stat_name": stat_name,
                "match_date": match_date.isoformat(),
            }
        )
        return None

    player_name = getattr(row, "player_name", None)
    raw_value = getattr(row, "value", None)
    if not player_name:
        logger.warning(
            {
                "message": "Skipping matchday stat leader with missing player name",
                "stat_name": stat_name,
                "match_date": match_date.isoformat(),
            }
        )
        return None

    payload = {
        "stat_name": stat_name,
        "value": _coerce_matchday_stat_value(stat_name, raw_value),
        "player_name": player_name,
    }
    logger.info(
        {
            "message": "Resolved top matchday stat leader",
            "stat_name": stat_name,
            "match_date": match_date.isoformat(),
            "player_name": player_name,
            "value": payload["value"],
        }
    )
    return payload


def get_matchday_statistics_by_date(db: Session, match_date: date):
    logger.info(
        {
            "message": "Fetching matchday statistics by date",
            "match_date": match_date.isoformat(),
        }
    )
    try:
        leaders = []
        for stat_name, value_expression in MATCHDAY_STAT_LEADER_SPECS:
            leader = _fetch_top_matchday_stat_leader(db, match_date, stat_name, value_expression)
            if leader is not None:
                leaders.append(leader)

        logger.info(
            {
                "message": "Resolved matchday statistics by date",
                "match_date": match_date.isoformat(),
                "count": len(leaders),
            }
        )
        return leaders
    except Exception as exc:
        logger.error(
            {
                "message": "Failed to fetch matchday statistics by date",
                "error": {"message": str(exc), "type": type(exc).__name__},
                "match_date": match_date.isoformat(),
            }
        )
        raise
