from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from db.models.historical_matches import HistoricalMatch
from db.models.matches import Match, MatchStatus
from db.models.ml_elo_history import MlEloHistory

logger = logging.getLogger(__name__)


def get_ml_elo_inputs(db: Session) -> dict[str, Any]:
    """
    Builds the unified match list `EloTransformations.calculate_ratings` replays over --
    `historical_matches` (2010-2022, always completed) unioned with the live `matches`
    table (WC26, filtered to completed). Each match's `id` is a composite string
    (`"historical:<id>"` / `"wc26:<id>"`) so the engine's opaque `match_id` passthrough
    can be traced back to its source table without any change to the engine itself.
    """
    logger.info({"message": "Fetching ML Elo replay inputs"})

    historical_matches = db.query(HistoricalMatch).all()
    wc26_matches = db.query(Match).filter(Match.status == MatchStatus.COMPLETED).all()

    matches: list[dict[str, Any]] = []
    match_dates: dict[str, Any] = {}

    for m in historical_matches:
        composite_id = f"historical:{m.id}"
        matches.append({
            "id": composite_id,
            "round": m.round,
            "home_team_code": m.home_team_code,
            "away_team_code": m.away_team_code,
            "kickoff_utc": m.kickoff_utc,
            "status": "completed",
            "home_score": m.home_score,
            "away_score": m.away_score,
            "home_pen": m.home_pen,
            "away_pen": m.away_pen,
        })
        match_dates[composite_id] = m.kickoff_utc

    for m in wc26_matches:
        composite_id = f"wc26:{m.id}"
        matches.append({
            "id": composite_id,
            "round": m.round,
            "home_team_code": m.home_team_code,
            "away_team_code": m.away_team_code,
            "kickoff_utc": m.kickoff_utc,
            "status": "completed",
            "home_score": m.home_score,
            "away_score": m.away_score,
            "home_pen": m.home_pen,
            "away_pen": m.away_pen,
        })
        match_dates[composite_id] = m.kickoff_utc

    logger.info({
        "message": "Fetched ML Elo replay inputs",
        "historical_count": len(historical_matches),
        "wc26_count": len(wc26_matches),
    })
    return {"matches": matches, "match_dates": match_dates}


def store_ml_elo_history(db: Session, history: list[dict[str, Any]], match_dates: dict[str, Any]) -> int:
    """
    Persists the Elo replay history into `ml_elo_history`. Fully replaces prior contents
    (this table only ever reflects the latest full replay) -- never touches
    `Team.elo_rating` or `team_elo_history`, so this can't leak into the live bracket page.
    """
    logger.info({"message": "Storing ML Elo replay history", "history_count": len(history or [])})

    rows = []
    for entry in history or []:
        composite_id = entry["match_id"]
        source_match_table, _, source_match_id = composite_id.partition(":")
        rows.append({
            "source_match_table": source_match_table,
            "source_match_id": int(source_match_id),
            "match_date": match_dates.get(composite_id),
            "team_code": entry["team_code"],
            "opponent_code": entry["opponent_code"],
            "rating_before": entry["rating_before"],
            "rating_after": entry["rating_after"],
            "rating_delta": entry["rating_delta"],
            "expected_score": entry["expected_score"],
            "actual_score": entry["actual_score"],
            "stage_weight": entry["stage_weight"],
            "margin_multiplier": entry["margin_multiplier"],
        })

    try:
        db.query(MlEloHistory).delete()
        if rows:
            db.bulk_insert_mappings(MlEloHistory, rows)
        db.commit()
        logger.info({"message": "Stored ML Elo replay history", "row_count": len(rows)})
        return len(rows)
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed to store ML Elo replay history",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
