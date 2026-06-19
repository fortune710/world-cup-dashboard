import logging
from typing import Optional, Literal

import requests
from fastapi import APIRouter, Depends, Path, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.players import (
    get_player_by_id,
    get_players_leaderboard,
    get_top_players_by_clean_sheets,
    get_top_players_by_assists,
    get_top_players_by_goals,
    get_top_players_by_rating,
    get_top_players_by_saves,
)
from server.player_image import (
    build_player_image_api_path,
    fetch_player_image_bytes,
    resolve_player_image_source_url,
)
from server.schemas.players import (
    PlayerClassification,
    PlayerInfoResponse,
    PlayerLeaderboardResponse,
    PlayerStatisticsResponse,
    PlayerTopCleanSheetsResponse,
    PlayerTopAssistsResponse,
    PlayerTopGoalsResponse,
    PlayerTopSavesResponse,
    RadarPeersListResponse,
    RadarPeerResponse,
    RadarPeerStatistics,
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
        "image_url": build_player_image_api_path(player.id),
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


@router.get("/{player_id}/image")
def get_player_image(
    player_id: int = Path(..., gt=0, description="Positive integer player ID"),
    db: Session = Depends(get_db),
):
    """
    Proxy player headshots through the API so browsers are not blocked by Sofascore hotlink protection.
    """
    logger.info({"message": "Fetching proxied player image", "player_id": player_id})

    player = get_player_by_id(db, player_id)
    if player is None:
        logger.warning({"message": "Player image not found", "player_id": player_id})
        raise HTTPException(status_code=404, detail=f"Player with id {player_id} not found.")

    source_url = resolve_player_image_source_url(player_id, player.image_url)
    try:
        image_bytes, content_type = fetch_player_image_bytes(source_url)
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Failed to fetch player image.") from None
    except ValueError as exc:
        status_code = 404 if str(exc) == "upstream_status_404" else 502
        raise HTTPException(status_code=status_code, detail="Player image unavailable.") from None

    logger.info(
        {
            "message": "Returning proxied player image",
            "player_id": player_id,
            "content_type": content_type,
            "byte_length": len(image_bytes),
        }
    )
    return Response(
        content=image_bytes,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


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
    db: Session = Depends(get_db),
    limit: int = Query(5, gt=0, description="Positive integer player ID"),
):
    logger.info({"message": "Fetching top players by goals", "limit": limit})
    players = get_top_players_by_goals(db, limit)
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
    db: Session = Depends(get_db),
    limit: int = Query(5, gt=0, description="Positive integer player ID"),
):
    logger.info({"message": "Fetching top players by assists", "limit": limit})
    players = get_top_players_by_assists(db, limit)
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
    db: Session = Depends(get_db),
    limit: int = Query(5, gt=0, description="Positive integer player ID"),
):
    logger.info({"message": "Fetching top players by rating", "limit": limit})
    players = get_top_players_by_rating(db, limit)
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
    db: Session = Depends(get_db),
    limit: int = Query(5, gt=0, description="Positive integer player ID"),
):
    logger.info({"message": "Fetching top players by clean sheets", "limit": limit})
    players = get_top_players_by_clean_sheets(db, limit)
    payload = []
    for player in players:
        player_payload = _player_info_payload(player)
        player_payload["clean_sheets"] = _player_stat_value(player, "clean_sheet", int)
        payload.append(player_payload)

    logger.info({"message": "Returning top players by clean sheets", "count": len(payload)})
    return payload


@router.get("/top/saves", response_model=list[PlayerTopSavesResponse])
def get_top_saves(
    db: Session = Depends(get_db),
    limit: int = Query(5, gt=0, description="Positive integer player ID"),
):
    logger.info({"message": "Fetching top players by saves", "limit": limit})
    players = get_top_players_by_saves(db, limit)
    payload = []
    for player in players:
        player_payload = _player_info_payload(player)
        player_payload["saves"] = _player_stat_value(player, "saves", int)
        payload.append(player_payload)

    logger.info({"message": "Returning top players by saves", "count": len(payload)})
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


ROLE_TO_POSITIONS = {
    "GK":  ["GK"],
    "CB":  ["CB"],
    "FB":  ["LB", "RB", "LWB", "RWB", "WB"],
    "DM":  ["DM"],
    "CM":  ["CM"],
    "AMW": ["AM", "LW", "RW", "W", "SS"],
    "ST":  ["ST", "CF", "FW", "F"],
}


@router.get("/radar-peers", response_model=RadarPeersListResponse)
def get_radar_peers(
    role: Literal["GK", "CB", "FB", "DM", "CM", "AMW", "ST"] = Query(..., description="Radar role to filter peers by"),
    min_minutes: int = Query(default=270, ge=0),
    db: Session = Depends(get_db)
):
    logger.info(
        {
            "message": "FastAPI fetching radar peers",
            "role": role,
            "min_minutes": min_minutes
        }
    )

    position_codes = ROLE_TO_POSITIONS.get(role, [])
    if not position_codes:
        logger.warning(
            {
                "message": "Unknown radar role requested",
                "role": role
            }
        )
        raise HTTPException(status_code=400, detail=f"Unknown role: {role}")

    from db.models.players import Player
    import sqlalchemy as sa

    # Exact token match for position codes (SQLite & Postgres compatible)
    pos_filters = []
    for code in position_codes:
        pos_filters.extend([
            Player.positions == code,
            Player.positions.like(f"{code},%"),
            Player.positions.like(f"%, {code},%"),
            Player.positions.like(f"%, {code}")
        ])

    rows = db.query(Player).filter(
        sa.or_(*pos_filters)
    ).all()

    peers = []
    for row in rows:
        stats_json = row.stats_json or {}
        if isinstance(stats_json, str):
            import json
            stats_json = json.loads(stats_json)

        try:
            player_minutes = int(stats_json.get("minutes_played") or 0)
        except (ValueError, TypeError):
            player_minutes = 0

        if player_minutes < min_minutes:
            continue

        # Safely extract stats
        stats_data = {}
        for field in RadarPeerStatistics.model_fields.keys():
            stats_data[field] = stats_json.get(field)

        peers.append(
            RadarPeerResponse(
                id=str(row.id),
                name=row.name,
                radarRole=role,
                statistics=RadarPeerStatistics(**stats_data)
            )
        )

    logger.info(
        {
            "message": "FastAPI returning radar peers",
            "role": role,
            "count": len(peers)
        }
    )
    return RadarPeersListResponse(peers=peers, total=len(peers))


