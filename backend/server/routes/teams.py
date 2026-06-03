from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.teams import get_all_teams
from server.schemas.teams import TeamStandingResponse
from typing import List

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("/groups", response_model=List[TeamStandingResponse])
def get_team_groups(
    name: str = Query("A", regex="^[A-L]$"),
    db: Session = Depends(get_db)
):
    """
    Get standings for a specific group (A-L).
    """
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
