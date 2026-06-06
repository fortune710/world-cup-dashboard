import logging
from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.players import get_player_by_id
from server.schemas.players import PlayerInfoResponse, PlayerStatisticsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/{player_id}/info", response_model=PlayerInfoResponse)
def get_player_info(
    player_id: int = Path(..., gt=0, description="Positive integer player ID"),
    db: Session = Depends(get_db)
):
    """
    Get all profile fields for a player (excluding stats_json).
    """
    logger.info("Fetching player info for id: %d", player_id)

    player = get_player_by_id(db, player_id)
    if player is None:
        logger.warning("Player with id %d not found", player_id)
        raise HTTPException(status_code=404, detail=f"Player with id {player_id} not found.")

    return {
        **player,
        "image_url": player.image_url or f"https://img.sofascore.com/api/v1/player/{player.sofascore_id}/image"
    }


@router.get("/{player_id}/statistics", response_model=PlayerStatisticsResponse)
def get_player_statistics(
    player_id: int = Path(..., gt=0, description="Positive integer player ID"),
    db: Session = Depends(get_db)
):
    """
    Get statistics (stats_json) for a player.
    """
    logger.info("Fetching player statistics for id: %d", player_id)

    player = get_player_by_id(db, player_id)
    if player is None:
        logger.warning("Player with id %d not found for statistics", player_id)
        raise HTTPException(status_code=404, detail=f"Player with id {player_id} not found.")

    return player
