import logging
from typing import Iterable

from sqlalchemy.orm import Session

from db.models.matchday_stats import MatchdayStats
from db.models.players import Player

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

    player_ids = {
        row.get("player_id")
        for row in rows
        if row.get("player_id") is not None
    }
    existing_player_ids = set()
    if player_ids:
        existing_player_ids = {
            player_id
            for (player_id,) in db.query(Player.id)
            .filter(Player.id.in_(player_ids))
            .all()
        }

    valid_rows = [
        row
        for row in rows
        if row.get("player_id") in existing_player_ids
    ]
    skipped_count = len(rows) - len(valid_rows)
    if skipped_count:
        skipped_player_ids = sorted(player_ids - existing_player_ids)
        logger.warning({
            "message": "Skipping matchday stats rows for players missing from players table",
            "match_id": match_id,
            "skipped_count": skipped_count,
            "skipped_player_ids": skipped_player_ids[:25],
            "skipped_player_id_count": len(skipped_player_ids),
        })

    if not valid_rows:
        logger.warning({
            "message": "No valid matchday stats rows remain after missing-player filter",
            "match_id": match_id,
            "match_date": match_date,
            "original_count": len(rows),
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
                for row in valid_rows
            ]
        )
        db.commit()
        logger.info({
            "message": "Completed matchday stats replace",
            "match_id": match_id,
            "deleted_count": deleted_count,
            "inserted_count": len(valid_rows),
            "skipped_missing_player_count": skipped_count,
        })
        return len(valid_rows)
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed to replace matchday stats",
            "match_id": match_id,
            "match_date": match_date,
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
