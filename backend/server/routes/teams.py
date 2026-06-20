import logging
from fastapi import APIRouter, Depends, Query, Path, HTTPException
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.teams import get_all_teams, get_team_by_code, get_team_statistics_rank
from db.controllers.players import get_team_players, get_team_top_performers
from server.schemas.teams import (
    TeamStandingResponse,
    TeamStatisticsRankResponse,
    TeamTopPerformersResponse,
    TeamTopPerformerRating,
    TeamTopPerformerGoals,
    TeamTopPerformerAssists,
    TeamTopPerformerChances,
)
from server.schemas.players import TeamPlayerResponse
from server.player_image import build_player_image_api_path
from server.routes.players import _player_info_payload, _player_stats_dict
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"])


def _build_team_top_performer_entry(player, stat_key: str, cast_type):
    logger.info(
        {
            "message": "Building team top performer entry",
            "player_id": getattr(player, "id", None),
            "stat_key": stat_key,
        }
    )
    base = _player_info_payload(player)
    stats_json = _player_stats_dict(player)
    base[stat_key] = cast_type(stats_json.get(stat_key, 0) or 0)
    logger.info(
        {
            "message": "Built team top performer entry",
            "player_id": getattr(player, "id", None),
            "stat_key": stat_key,
            "value": base[stat_key],
        }
    )
    return base

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

@router.get("/{code}/top-performers", response_model=TeamTopPerformersResponse)
def get_team_top_performers_route(
    code: str = Path(..., min_length=3, max_length=3, description="3-character country code"),
    db: Session = Depends(get_db),
):
    """
    Get the top-rated, top-scoring, top-assisting, and most creative players for a team.
    """
    logger.info({"message": "Fetching team top performers", "team_code": code})
    team = get_team_by_code(db, code)
    if not team:
        raise HTTPException(status_code=404, detail=f"Team not found: {code}")

    performers = get_team_top_performers(db, code, limit=1)
    rating_player = performers["rating"][0] if performers["rating"] else None
    goals_player = performers["goals"][0] if performers["goals"] else None
    assists_player = performers["assists"][0] if performers["assists"] else None
    chances_player = (
        performers["big_chances_created"][0]
        if performers["big_chances_created"]
        else None
    )

    payload = TeamTopPerformersResponse(
        rating=TeamTopPerformerRating(**_build_team_top_performer_entry(rating_player, "rating", float))
        if rating_player
        else None,
        goals=TeamTopPerformerGoals(**_build_team_top_performer_entry(goals_player, "goals", int))
        if goals_player
        else None,
        assists=TeamTopPerformerAssists(**_build_team_top_performer_entry(assists_player, "assists", int))
        if assists_player
        else None,
        big_chances_created=TeamTopPerformerChances(
            **_build_team_top_performer_entry(
                chances_player, "big_chances_created", int
            )
        )
        if chances_player
        else None,
    )
    logger.info({"message": "Returning team top performers", "team_code": code})
    return payload


@router.get("/{code}/statistics-rank", response_model=TeamStatisticsRankResponse)
def get_team_statistics_rank_route(
    code: str = Path(..., min_length=3, max_length=3, description="3-character country code"),
    db: Session = Depends(get_db),
):
    """
    Get aggregated team statistics and tournament rank out of all teams.
    """
    logger.info({"message": "Fetching team statistics rank", "team_code": code})
    team = get_team_by_code(db, code)
    if not team:
        raise HTTPException(status_code=404, detail=f"Team not found: {code}")

    rank_data = get_team_statistics_rank(db, code)
    if not rank_data:
        raise HTTPException(
            status_code=404,
            detail=f"No player statistics available for team: {code}",
        )

    payload = TeamStatisticsRankResponse(**rank_data)
    logger.info({"message": "Returning team statistics rank", "team_code": code})
    return payload

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
