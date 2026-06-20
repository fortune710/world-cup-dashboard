import logging
from fastapi import APIRouter, Depends, Query, Path, HTTPException
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.teams import get_all_teams
from db.controllers.players import get_team_players
from server.schemas.teams import TeamStandingResponse
from server.schemas.players import TeamPlayerResponse
from server.player_image import build_player_image_api_path
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("", response_model=List[TeamStandingResponse])
def get_teams(db: Session = Depends(get_db)):
    """
    Get all teams.
    """
    logger.info({"message": "Fetching all teams"})
    teams = get_all_teams(db)
    
    standings = []
    for team in teams:
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
            points=team.points or 0,
            group=team.group,
            fifa_ranking=team.fifa_ranking,
            elo_rating=team.elo_rating
        ))
    logger.info({"message": "Successfully fetched all teams", "count": len(standings)})
    return standings

@router.get("/groups", response_model=List[TeamStandingResponse])
def get_team_groups(
    group: str | None = Query(None, pattern="^[A-L]$"),
    name: str | None = Query(None, pattern="^[A-L]$"),
    db: Session = Depends(get_db)
):
    """
    Get standings for a specific group (A-L).
    """
    group_name = group or name or "A"
    logger.info({
        "message": "Fetching group standings",
        "group_name": group_name,
        "group_query": group,
        "name_query": name,
    })
    teams = get_all_teams(db, group=group_name)
    
    standings = []
    for team in teams:
        # Calculate goal difference
        gd = (team.goals_for or 0) - (team.goals_against or 0)
        team_name = team.name or ""
        team_code = team.code or ""
        
        standings.append(TeamStandingResponse(
            name=team_name,
            code=team_code,
            matches_played=team.matches_played or 0,
            matches_won=team.matches_won or 0,
            matches_drawn=team.matches_drawn or 0,
            matches_lost=team.matches_lost or 0,
            goals_for=team.goals_for or 0,
            goals_against=team.goals_against or 0,
            goal_difference=gd,
            points=team.points or 0,
            group=team.group,
            fifa_ranking=team.fifa_ranking,
            elo_rating=team.elo_rating
        ))
    logger.info({
        "message": "Successfully fetched group standings",
        "group_name": group_name,
        "count": len(standings),
    })
    return standings

@router.get("/players/{code}", response_model=List[TeamPlayerResponse])
def get_team_players_route(
    code: str = Path(..., min_length=3, max_length=3, description="3-character country code"),
    db: Session = Depends(get_db)
):
    """
    Get players for a specific team code.
    """
    logger.info({"message": "Fetching players for team code", "team_code": code})
    if not code or len(code) != 3:
        raise HTTPException(status_code=400, detail="Invalid team code. Must be 3 characters.")
    
    players = get_team_players(db, code)
    payload = [
        TeamPlayerResponse(
            id=player.id,
            name=player.name,
            club_name=player.club_name,
            classification=player.classification,
            image_url=build_player_image_api_path(player.id),
            positions=player.positions,
        )
        for player in players
    ]
    logger.info(
        {
            "message": "Returning team players with proxied image URLs",
            "team_code": code,
            "count": len(payload),
        }
    )
    return payload
