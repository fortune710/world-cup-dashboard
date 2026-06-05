import logging
from fastapi import APIRouter, Depends, Query, Path, HTTPException
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.teams import get_all_teams
from db.controllers.players import get_team_players
from server.schemas.teams import TeamStandingResponse
from server.schemas.players import TeamPlayerResponse
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("/groups", response_model=List[TeamStandingResponse])
def get_team_groups(
    name: str = Query("A", regex="^[A-L]$"),
    db: Session = Depends(get_db)
):
    """
    Get standings for a specific group (A-L).
    """
    logger.info("Fetching group standings for group: %s", name)
    teams = get_all_teams(db, group=name)
    
    standings = []
    for team in teams:
        # Calculate goal difference
        gd = (team.goals_for or 0) - (team.goals_against or 0)
        
        standings.append(TeamStandingResponse(
            name=team.name,
            code=team.code,
            matches_played=team.matches_played or 0,
            matches_won=team.matches_won or 0,
            matches_drawn=team.matches_drawn or 0,
            matches_lost=team.matches_lost or 0,
            goals_for=team.goals_for or 0,
            goals_against=team.goals_against or 0,
            goal_difference=gd,
            points=team.points or 0
        ))
    
    return standings

@router.get("/players/{code}", response_model=List[TeamPlayerResponse])
def get_team_players_route(
    code: str = Path(..., min_length=3, max_length=3, description="3-character country code"),
    db: Session = Depends(get_db)
):
    """
    Get players for a specific team code.
    """
    logger.info("Fetching players for team code: %s", code)
    if not code or len(code) != 3:
        raise HTTPException(status_code=400, detail="Invalid team code. Must be 3 characters.")
    
    players = get_team_players(db, code)
    return players
