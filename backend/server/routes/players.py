import logging
from typing import Optional

from fastapi import APIRouter, Depends, Path, HTTPException, Query
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.players import (
    get_player_by_id,
    get_players_leaderboard,
    get_top_players_by_clean_sheets,
    get_top_players_by_assists,
    get_top_players_by_goals,
    get_top_players_by_rating,
)
from server.schemas.players import (
    PlayerClassification,
    PlayerInfoResponse,
    PlayerLeaderboardResponse,
    PlayerStatisticsResponse,
    PlayerTopCleanSheetsResponse,
    PlayerTopAssistsResponse,
    PlayerTopGoalsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/players", tags=["players"])


def _player_stats_dict(player):
    logger.info(
        {
            "message": "Extracting player stats json",
            "player_id": getattr(player, "id", None),
        }
    )
    stats_json = getattr(player, "stats_json", None) or {}
    if isinstance(stats_json, str):
        import json

        stats_json = json.loads(stats_json)

    logger.info(
        {
            "message": "Extracted player stats json",
            "player_id": getattr(player, "id", None),
        }
    )
    return stats_json


def _player_info_payload(player):
    logger.info(
        {
            "message": "Building player info payload",
            "player_id": getattr(player, "id", None),
        }
    )
    country_code = getattr(player, "country_code", None) or ""
    payload = {
        "id": player.id,
        "name": player.name,
        "date_of_birth": player.date_of_birth,
        "classification": player.classification,
        "club_name": player.club_name,
        "positions": player.positions,
        "weight_kg": player.weight_kg,
        "height_cm": player.height_cm,
        "foot": player.foot,
        "country_code": country_code,
        "market_value": player.market_value,
        "image_url": player.image_url or f"https://img.sofascore.com/api/v1/player/{player.id}/image",
        "rating": player.rating,
    }
    logger.info(
        {
            "message": "Built player info payload",
            "player_id": getattr(player, "id", None),
        }
    )
    return payload


def _player_stat_value(player, stat_key: str, cast_type):
    logger.info(
        {
            "message": "Extracting player stat value",
            "player_id": getattr(player, "id", None),
            "stat_key": stat_key,
        }
    )
    stats_json = _player_stats_dict(player)
    stat_value = cast_type(stats_json.get(stat_key, 0) or 0)
    logger.info(
        {
            "message": "Extracted player stat value",
            "player_id": getattr(player, "id", None),
            "stat_key": stat_key,
            "value": stat_value,
        }
    )
    return stat_value


@router.get("/{player_id}/info", response_model=PlayerInfoResponse)
def get_player_info(
    player_id: int = Path(..., gt=0, description="Positive integer player ID"),
    db: Session = Depends(get_db)
):
    """
    Get all profile fields for a player (excluding stats_json).
    """
    logger.info({"message": "Fetching player info", "player_id": player_id})

    player = get_player_by_id(db, player_id)
    if player is None:
        logger.warning({"message": "Player not found", "player_id": player_id})
        raise HTTPException(status_code=404, detail=f"Player with id {player_id} not found.")

    return _player_info_payload(player)


@router.get("/{player_id}/statistics", response_model=PlayerStatisticsResponse)
def get_player_statistics(
    player_id: int = Path(..., gt=0, description="Positive integer player ID"),
    db: Session = Depends(get_db)
):
    """
    Get statistics (stats_json) for a player.
    """
    logger.info({"message": "Fetching player statistics", "player_id": player_id})

    player = get_player_by_id(db, player_id)
    if player is None:
        logger.warning({"message": "Player statistics not found", "player_id": player_id})
        raise HTTPException(status_code=404, detail=f"Player with id {player_id} not found.")

    stats_json = _player_stats_dict(player)
    logger.info(
        {
            "message": "Returning player statistics",
            "player_id": player_id,
        }
    )
    return {
        "id": player.id,
        "name": player.name,
        "statistics": stats_json,
    }


@router.get("/top/goals", response_model=list[PlayerTopGoalsResponse])
def get_top_goals(
    db: Session = Depends(get_db)
):
    logger.info({"message": "Fetching top players by goals", "limit": 5})
    players = get_top_players_by_goals(db)
    payload = []
    for player in players:
        player_payload = _player_info_payload(player)
        stats_json = _player_stats_dict(player)
        player_payload["goals"] = int(stats_json.get("goals", 0) or 0)
        payload.append(player_payload)

    logger.info({"message": "Returning top players by goals", "count": len(payload)})
    return payload


@router.get("/top/assists", response_model=list[PlayerTopAssistsResponse])
def get_top_assists(
    db: Session = Depends(get_db)
):
    logger.info({"message": "Fetching top players by assists", "limit": 5})
    players = get_top_players_by_assists(db)
    payload = []
    for player in players:
        player_payload = _player_info_payload(player)
        stats_json = _player_stats_dict(player)
        player_payload["assists"] = int(stats_json.get("assists", 0) or 0)
        payload.append(player_payload)

    logger.info({"message": "Returning top players by assists", "count": len(payload)})
    return payload


@router.get("/top/rating", response_model=list[PlayerInfoResponse])
def get_top_rating(
    db: Session = Depends(get_db)
):
    logger.info({"message": "Fetching top players by rating", "limit": 5})
    players = get_top_players_by_rating(db)
    payload = []
    for player in players:
        player_payload = _player_info_payload(player)
        stats_json = _player_stats_dict(player)
        player_payload["rating"] = stats_json.get("rating", 0)
        payload.append(player_payload)

    logger.info({"message": "Returning top players by rating", "count": len(payload)})
    return payload


@router.get("/top/clean-sheets", response_model=list[PlayerTopCleanSheetsResponse])
def get_top_clean_sheets(
    db: Session = Depends(get_db)
):
    logger.info({"message": "Fetching top players by clean sheets", "limit": 5})
    players = get_top_players_by_clean_sheets(db)
    payload = []
    for player in players:
        player_payload = _player_info_payload(player)
        player_payload["clean_sheets"] = _player_stat_value(player, "clean_sheet", int)
        payload.append(player_payload)

    logger.info({"message": "Returning top players by clean sheets", "count": len(payload)})
    return payload


@router.get(
    "",
    response_model=list[PlayerLeaderboardResponse],
    summary="List players ordered by rating",
    description=(
        "Return players ordered by descending rating with optional name search and "
        "classification filtering. The response includes team image and group metadata."
    ),
)
def list_players(
    limit: int = Query(10, ge=1, le=100, description="Maximum number of players to return"),
    search: Optional[str] = Query(
        None,
        min_length=1,
        description="Full-text search term for player name",
    ),
    classification: Optional[PlayerClassification] = Query(
        None,
        description="Filter players by classification",
    ),
    db: Session = Depends(get_db),
):
    logger.info(
        {
            "message": "Fetching players leaderboard",
            "limit": limit,
            "search": search,
            "classification": getattr(classification, "value", None) if classification else None,
        }
    )
    leaderboard = get_players_leaderboard(
        db=db,
        limit=limit,
        search=search,
        classification=classification,
    )
    logger.info(
        {
            "message": "Returning players leaderboard",
            "count": len(leaderboard),
            "limit": limit,
            "search": search,
            "classification": getattr(classification, "value", None) if classification else None,
        }
    )
    return leaderboard
