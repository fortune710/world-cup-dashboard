import logging
from typing import Any

from sqlalchemy.orm import Session

from db.models.elo import TeamEloHistory
from db.models.matches import Match
from db.models.teams import Team


logger = logging.getLogger(__name__)
DEFAULT_ELO_RATING = 1500.0


def get_elo_inputs(db: Session) -> tuple[list[Team], list[Match]]:
    logger.info({"message": "Fetching Elo input data"})
    teams = db.query(Team).all()
    matches = (
        db.query(Match)
        .filter(Match.status == "completed")
        .order_by(Match.kickoff_utc.asc(), Match.id.asc())
        .all()
    )
    logger.info({
        "message": "Fetched Elo input data",
        "team_count": len(teams),
        "completed_match_count": len(matches),
    })
    return teams, matches


def replace_elo_ratings(db: Session, team_ratings: dict[str, float], history: list[dict[str, Any]]) -> int:
    logger.info({
        "message": "Replacing Elo ratings and history",
        "team_rating_count": len(team_ratings),
        "history_count": len(history),
    })

    try:
        db.query(TeamEloHistory).delete()
        db.query(Team).update({Team.elo_rating: DEFAULT_ELO_RATING}, synchronize_session=False)

        for team_code, rating in team_ratings.items():
            updated_count = db.query(Team).filter(Team.code == team_code).update(
                {Team.elo_rating: rating},
                synchronize_session=False,
            )
            if updated_count == 0:
                raise ValueError(f"Team code {team_code} not found")

        if history:
            db.bulk_insert_mappings(TeamEloHistory, history)

        db.commit()
        logger.info({
            "message": "Replaced Elo ratings and history",
            "team_rating_count": len(team_ratings),
            "history_count": len(history),
        })
        return len(history)
    except Exception as e:
        db.rollback()
        logger.error({
            "message": "Failed to replace Elo ratings and history",
            "error": {"message": str(e), "type": type(e).__name__},
        })
        raise


def get_elo_rankings(db: Session) -> list[Team]:
    logger.info({"message": "Fetching Elo rankings"})
    teams = db.query(Team).order_by(Team.elo_rating.desc(), Team.name.asc()).all()
    logger.info({"message": "Fetched Elo rankings", "team_count": len(teams)})
    return teams


def get_team_elo_history(db: Session, team_code: str) -> list[TeamEloHistory]:
    logger.info({"message": "Fetching team Elo history", "team_code": team_code})
    history = (
        db.query(TeamEloHistory)
        .join(Match, TeamEloHistory.match_id == Match.id)
        .filter(TeamEloHistory.team_code == team_code)
        .order_by(Match.kickoff_utc.asc(), TeamEloHistory.match_id.asc(), TeamEloHistory.id.asc())
        .all()
    )
    logger.info({
        "message": "Fetched team Elo history",
        "team_code": team_code,
        "history_count": len(history),
    })
    return history
