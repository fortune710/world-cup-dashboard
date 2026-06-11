import logging
from typing import Iterable

from sqlalchemy.orm import Session

from db.models.matchday_stats import MatchdayStats

logger = logging.getLogger(__name__)


def replace_matchday_stats_for_match(
    db: Session,
    match_id: int,
    match_date,
    matchday_stats_rows: Iterable[dict],
) -> int:
    rows = [dict(row) for row in matchday_stats_rows or []]
    logger.info({
        "message": "Starting matchday stats replace",
        "match_id": match_id,
        "match_date": match_date,
        "count": len(rows),
    })
    if not rows:
        logger.warning({
            "message": "No matchday stats rows supplied for replace",
            "match_id": match_id,
            "match_date": match_date,
        })
        return 0

    try:
        deleted_count = (
            db.query(MatchdayStats)
            .filter(MatchdayStats.match_id == match_id)
            .delete(synchronize_session=False)
        )

        db.add_all(
            [
                MatchdayStats(
                    player_id=row.get("player_id"),
                    match_id=match_id,
                    match_date=row.get("match_date") or match_date,
                    statistics=row.get("statistics"),
                )
                for row in rows
            ]
        )
        db.commit()
        logger.info({
            "message": "Completed matchday stats replace",
            "match_id": match_id,
            "deleted_count": deleted_count,
            "inserted_count": len(rows),
        })
        return len(rows)
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed to replace matchday stats",
            "match_id": match_id,
            "match_date": match_date,
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
