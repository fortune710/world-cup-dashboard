import logging
from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.players import (
    get_player_by_id,
    get_top_players_by_assists,
    get_top_players_by_goals,
    get_top_players_by_rating,
)
from server.schemas.players import (
    PlayerInfoResponse,
    PlayerStatisticsResponse,
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
        "country_code": player.country_code,
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
