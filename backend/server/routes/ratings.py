import logging
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.db import get_db
from db.controllers.elo import get_elo_rankings, get_team_elo_history
from server.schemas.elo import EloRankingResponse, TeamEloHistoryResponse


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.get("/elo", response_model=List[EloRankingResponse])
def get_elo_table(db: Session = Depends(get_db)):
    logger.info({"message": "Handling Elo rankings request"})
    teams = get_elo_rankings(db)
    response = [
        EloRankingResponse(
            rank=index + 1,
            team_code=team.code,
            team_name=team.name,
            team_image_url=team.image_url,
            elo_rating=team.elo_rating if team.elo_rating is not None else 1500.0,
        )
        for index, team in enumerate(teams)
    ]
    logger.info({"message": "Handled Elo rankings request", "team_count": len(response)})
    return response


@router.get("/elo/{team_code}/history", response_model=List[TeamEloHistoryResponse])
def get_elo_history(team_code: str, db: Session = Depends(get_db)):
    normalized_team_code = team_code.upper()
    logger.info({
        "message": "Handling Elo history request",
        "team_code": normalized_team_code,
    })
    history = get_team_elo_history(db, normalized_team_code)
    response = [
        TeamEloHistoryResponse(
            match_id=row.match_id,
            team_code=row.team_code,
            opponent_code=row.opponent_code,
            rating_before=row.rating_before,
            rating_after=row.rating_after,
            rating_delta=row.rating_delta,
            expected_score=row.expected_score,
            actual_score=row.actual_score,
            stage_weight=row.stage_weight,
            margin_multiplier=row.margin_multiplier,
        )
        for row in history
    ]
    logger.info({
        "message": "Handled Elo history request",
        "team_code": normalized_team_code,
        "history_count": len(response),
    })
    return response
