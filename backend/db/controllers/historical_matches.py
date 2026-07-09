from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from db.models.historical_matches import HistoricalMatch

logger = logging.getLogger(__name__)


def _find_existing_historical_match(db: Session, match_data: dict) -> HistoricalMatch | None:
    sofascore_id = match_data.get("sofascore_id")
    if sofascore_id is not None:
        existing = db.query(HistoricalMatch).filter(HistoricalMatch.sofascore_id == sofascore_id).first()
        if existing:
            return existing

    return (
        db.query(HistoricalMatch)
        .filter(
            HistoricalMatch.season_id == match_data.get("season_id"),
            HistoricalMatch.home_team_code == match_data.get("home_team_code"),
            HistoricalMatch.away_team_code == match_data.get("away_team_code"),
            HistoricalMatch.round == match_data.get("round"),
        )
        .first()
    )


def upsert_historical_match(db: Session, match_data: dict) -> HistoricalMatch:
    logger.info({
        "message": "Upserting historical match",
        "sofascore_id": match_data.get("sofascore_id"),
        "season_id": match_data.get("season_id"),
        "home_team_code": match_data.get("home_team_code"),
        "away_team_code": match_data.get("away_team_code"),
        "round": match_data.get("round"),
    })

    db_match = _find_existing_historical_match(db, match_data)
    if db_match:
        for key, value in match_data.items():
            setattr(db_match, key, value)
    else:
        db_match = HistoricalMatch(**match_data)
        db.add(db_match)

    db.commit()
    db.refresh(db_match)
    logger.info({
        "message": "Upserted historical match",
        "historical_match_id": db_match.id,
        "sofascore_id": db_match.sofascore_id,
    })
    return db_match


def get_historical_matches(db: Session, tournament_year: int | None = None) -> list[HistoricalMatch]:
    logger.info({"message": "Fetching historical matches", "tournament_year": tournament_year})
    query = db.query(HistoricalMatch)
    if tournament_year is not None:
        query = query.filter(HistoricalMatch.tournament_year == tournament_year)
    matches = query.order_by(HistoricalMatch.kickoff_utc.asc(), HistoricalMatch.id.asc()).all()
    logger.info({"message": "Fetched historical matches", "count": len(matches)})
    return matches


def get_historical_matches_pending_detail(db: Session) -> list[HistoricalMatch]:
    logger.info({"message": "Fetching historical matches pending detail fetch"})
    matches = (
        db.query(HistoricalMatch)
        .filter(HistoricalMatch.detail_indexed.is_(False), HistoricalMatch.sofascore_id.isnot(None))
        .order_by(HistoricalMatch.kickoff_utc.asc(), HistoricalMatch.id.asc())
        .all()
    )
    logger.info({"message": "Fetched historical matches pending detail fetch", "count": len(matches)})
    return matches


def store_historical_match_detail(db: Session, historical_match_id: int, detail_json: dict) -> HistoricalMatch | None:
    logger.info({"message": "Storing historical match detail", "historical_match_id": historical_match_id})
    db_match = db.query(HistoricalMatch).filter(HistoricalMatch.id == historical_match_id).first()
    if not db_match:
        logger.warning({
            "message": "Historical match not found for detail storage",
            "historical_match_id": historical_match_id,
        })
        return None

    db_match.detail_json = detail_json
    db_match.detail_indexed = True
    db.commit()
    db.refresh(db_match)
    logger.info({"message": "Stored historical match detail", "historical_match_id": historical_match_id})
    return db_match
