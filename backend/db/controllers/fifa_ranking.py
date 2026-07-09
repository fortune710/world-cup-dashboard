from __future__ import annotations

import logging
from datetime import date

from sqlalchemy.orm import Session

from db.models.fifa_ranking_snapshot import FifaRankingSnapshot

logger = logging.getLogger(__name__)


def upsert_fifa_ranking_snapshot(db: Session, snapshot_data: dict) -> FifaRankingSnapshot:
    db_snapshot = (
        db.query(FifaRankingSnapshot)
        .filter(
            FifaRankingSnapshot.team_code == snapshot_data["team_code"],
            FifaRankingSnapshot.as_of_date == snapshot_data["as_of_date"],
        )
        .first()
    )
    if db_snapshot:
        for key, value in snapshot_data.items():
            setattr(db_snapshot, key, value)
    else:
        db_snapshot = FifaRankingSnapshot(**snapshot_data)
        db.add(db_snapshot)

    return db_snapshot


def get_nearest_fifa_rank(db: Session, team_code: str, as_of_date: date) -> FifaRankingSnapshot | None:
    """
    Point-in-time lookup: the most recent ranking snapshot on or before `as_of_date`
    for `team_code`. With one snapshot loaded per tournament, this naturally resolves
    to the correct tournament's snapshot for any match date within it -- no need to
    know which tournament_year a snapshot belongs to.
    """
    return (
        db.query(FifaRankingSnapshot)
        .filter(FifaRankingSnapshot.team_code == team_code, FifaRankingSnapshot.as_of_date <= as_of_date)
        .order_by(FifaRankingSnapshot.as_of_date.desc())
        .first()
    )
