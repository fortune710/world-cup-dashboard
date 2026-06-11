import logging
from datetime import timezone

from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from db.models.matches import Match, MatchStatus
from datetime import datetime

logger = logging.getLogger(__name__)

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
        if match_identity.get("kickoff_utc") is not None:
            kickoff_utc = match_identity["kickoff_utc"]
            if isinstance(kickoff_utc, datetime) and kickoff_utc.tzinfo is not None:
                kickoff_utc = kickoff_utc.astimezone(timezone.utc).replace(tzinfo=None)
            query = query.filter(Match.kickoff_utc == kickoff_utc)

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
