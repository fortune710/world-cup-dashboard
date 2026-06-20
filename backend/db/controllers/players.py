import logging
import sqlalchemy as sa
from sqlalchemy.orm import Session
from db.models.players import Player, PlayerClassification, upsert_players_batch
from db.models.teams import Team

logger = logging.getLogger(__name__)

def upsert_player(db: Session, player_data: dict):
    logger.info("Upserting player with id: %s", player_data.get('id'))
    db_player = db.query(Player).filter(Player.id == player_data['id']).first()
    if db_player:
        for key, value in player_data.items():
            setattr(db_player, key, value)
    else:
        db_player = Player(**player_data)
        db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

def get_player_by_id(db: Session, player_id: int):
    logger.info("Fetching player by id: %d", player_id)
    return db.query(Player).filter(Player.id == player_id).first()


def upsert_players(db: Session, players_data: list[dict]) -> int:
    logger.info("Upserting %d players", len(players_data))
    return upsert_players_batch(db, players_data)

def update_player_stats(db: Session, player_id: int, rating: float, stats_json: dict):
    """
    Updates only the statistics of a player.
    """
    logger.info({
        "message": "Updating player stats for id",
        "player_id": player_id,
    })
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        logger.warning({
            "message": "Player not found while updating stats",
            "player_id": player_id,
        })
        return None

    db_player.rating = rating
    db_player.stats_json = stats_json
    db_player.stats_queue_pending = False
    db.commit()
    db.refresh(db_player)
    logger.info({
        "message": "Updated player stats and cleared queue pending flag",
        "player_id": player_id,
    })
    return db_player


def update_player_stats_batch(
    db: Session,
    player_stats_updates: list[dict],
    release_player_ids: list[int] | None = None,
) -> dict:
    logger.info({
        "message": "Starting batch player stats update",
        "update_count": len(player_stats_updates),
        "release_count": len(release_player_ids or []),
    })
    updated_count = 0
    released_count = 0

    try:
        for update in player_stats_updates:
            player_id = update.get("player_id")
            logger.info({
                "message": "Applying player stats update from batch",
                "player_id": player_id,
            })
            db_player = db.query(Player).filter(Player.id == player_id).first()
            if not db_player:
                logger.warning({
                    "message": "Player not found during batch player stats update",
                    "player_id": player_id,
                })
                continue

            db_player.rating = update.get("rating")
            db_player.stats_json = update.get("stats_json")
            db_player.stats_queue_pending = False
            updated_count += 1

        for player_id in release_player_ids or []:
            logger.info({
                "message": "Releasing pending player without stats",
                "player_id": player_id,
            })
            db_player = db.query(Player).filter(Player.id == player_id).first()
            if not db_player:
                logger.warning({
                    "message": "Player not found while releasing pending flag in batch",
                    "player_id": player_id,
                })
                continue

            db_player.stats_queue_pending = False
            released_count += 1

        db.commit()
        logger.info({
            "message": "Completed batch player stats update",
            "updated_count": updated_count,
            "released_count": released_count,
        })
        return {
            "updated_count": updated_count,
            "released_count": released_count,
        }
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed batch player stats update",
            "error": {
                "message": str(exc),
                "type": type(exc).__name__,
            },
        }, exc_info=True)
        raise


def claim_player_stats_queue_pending(db: Session, player_id: int, batch_key: str) -> bool:
    logger.info({
        "message": "Attempting to claim player for stats queue",
        "player_id": player_id,
        "batch_key": batch_key,
    })
    try:
        updated_rows = (
            db.query(Player)
            .filter(
                Player.id == player_id,
                Player.stats_queue_pending.is_(False),
                sa.func.coalesce(Player.stats_last_enqueued_batch_key, "") != batch_key,
            )
            .update(
            {
                    Player.stats_queue_pending: True,
                    Player.stats_last_enqueued_batch_key: batch_key,
                },
                synchronize_session=False,
            )
        )
        db.commit()
        claimed = updated_rows > 0
        logger.info({
            "message": "Claimed player for stats queue" if claimed else "Player already pending or already queued for batch",
            "player_id": player_id,
            "batch_key": batch_key,
            "claimed": claimed,
        })
        return claimed
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed to claim player for stats queue",
            "player_id": player_id,
            "batch_key": batch_key,
            "error": {
                "message": str(exc),
                "type": type(exc).__name__,
            },
        }, exc_info=True)
        raise


def clear_player_stats_queue_pending(db: Session, player_id: int) -> bool:
    logger.info({
        "message": "Clearing player stats queue pending flag",
        "player_id": player_id,
    })
    try:
        updated_rows = (
            db.query(Player)
            .filter(Player.id == player_id)
            .update({Player.stats_queue_pending: False}, synchronize_session=False)
        )
        db.commit()
        cleared = updated_rows > 0
        logger.info({
            "message": "Cleared player stats queue pending flag" if cleared else "Player not found while clearing stats queue pending flag",
            "player_id": player_id,
            "cleared": cleared,
        })
        return cleared
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed to clear player stats queue pending flag",
            "player_id": player_id,
            "error": {
                "message": str(exc),
                "type": type(exc).__name__,
            },
        }, exc_info=True)
        raise


def release_player_stats_queue_pending(db: Session, player_id: int, reset_batch_key: bool = False) -> bool:
    logger.info({
        "message": "Releasing player stats queue claim",
        "player_id": player_id,
        "reset_batch_key": reset_batch_key,
    })
    try:
        update_values = {Player.stats_queue_pending: False}
        if reset_batch_key:
            update_values[Player.stats_last_enqueued_batch_key] = None

        updated_rows = (
            db.query(Player)
            .filter(Player.id == player_id)
            .update(update_values, synchronize_session=False)
        )
        db.commit()
        released = updated_rows > 0
        logger.info({
            "message": "Released player stats queue claim" if released else "Player not found while releasing stats queue claim",
            "player_id": player_id,
            "reset_batch_key": reset_batch_key,
            "released": released,
        })
        return released
    except Exception as exc:
        db.rollback()
        logger.error({
            "message": "Failed to release player stats queue claim",
            "player_id": player_id,
            "reset_batch_key": reset_batch_key,
            "error": {
                "message": str(exc),
                "type": type(exc).__name__,
            },
        }, exc_info=True)
        raise

def get_players_by_team(db: Session, team_code: str):
    """
    Fetches all players for a given team code.
    """
    logger.info("Fetching all players for team code: %s", team_code)
    return db.query(Player).filter(Player.country_code == team_code).all()

def get_team_players(db: Session, team_code: str):
    """
    Returns players for a team with specific fields:
    id, name, club_name, classification, image_url, positions
    """
    logger.info("Fetching team players for code: %s", team_code)
    return db.query(
        Player.id,
        Player.name,
        Player.club_name,
        Player.classification,
        Player.image_url,
        Player.positions
    ).filter(Player.country_code == team_code).all()


def _get_top_players_by_stat(db: Session, stat_key: str, cast_sql: str, stat_label: str, limit: int = 5):
    logger.info(
        {
            "message": "Fetching top players by stat",
            "stat_key": stat_key,
            "stat_label": stat_label,
            "limit": limit,
        }
    )
    stat_expression = sa.literal_column(
        f"coalesce((players.stats_json ->> '{stat_key}')::{cast_sql}, 0)"
    )
    players = (
        db.query(Player)
        .order_by(stat_expression.desc(), Player.id.asc())
        .limit(limit)
        .all()
    )
    logger.info(
        {
            "message": "Fetched top players by stat",
            "stat_key": stat_key,
            "stat_label": stat_label,
            "count": len(players),
        }
    )
    return players


def get_top_players_by_goals(db: Session, limit: int = 5):
    return _get_top_players_by_stat(db, "goals", "integer", "goals", limit)


def get_top_players_by_assists(db: Session, limit: int = 5):
    return _get_top_players_by_stat(db, "assists", "integer", "assists", limit)


def get_top_players_by_rating(db: Session, limit: int = 5):
    return _get_top_players_by_stat(db, "rating", "double precision", "rating", limit)


def get_top_players_by_clean_sheets(db: Session, limit: int = 5):
    return _get_top_players_by_stat(db, "clean_sheet", "integer", "clean_sheets", limit)


def get_top_players_by_saves(db: Session, limit: int = 5):
    return _get_top_players_by_stat(db, "saves", "integer", "saves", limit)


def _get_team_top_players_by_stat(
    db: Session,
    team_code: str,
    stat_key: str,
    cast_sql: str,
    stat_label: str,
    limit: int = 1,
):
    logger.info(
        {
            "message": "Fetching team top players by stat",
            "team_code": team_code,
            "stat_key": stat_key,
            "stat_label": stat_label,
            "limit": limit,
        }
    )
    stat_expression = sa.literal_column(
        f"coalesce((players.stats_json ->> '{stat_key}')::{cast_sql}, 0)"
    )
    players = (
        db.query(Player)
        .filter(Player.country_code == team_code)
        .order_by(stat_expression.desc(), Player.id.asc())
        .limit(limit)
        .all()
    )
    logger.info(
        {
            "message": "Fetched team top players by stat",
            "team_code": team_code,
            "stat_key": stat_key,
            "stat_label": stat_label,
            "count": len(players),
        }
    )
    return players


def get_team_top_performers(db: Session, team_code: str, limit: int = 1):
    logger.info(
        {
            "message": "Fetching team top performers",
            "team_code": team_code,
            "limit": limit,
        }
    )
    performers = {
        "rating": _get_team_top_players_by_stat(
            db, team_code, "rating", "double precision", "rating", limit
        ),
        "goals": _get_team_top_players_by_stat(
            db, team_code, "goals", "integer", "goals", limit
        ),
        "assists": _get_team_top_players_by_stat(
            db, team_code, "assists", "integer", "assists", limit
        ),
        "big_chances_created": _get_team_top_players_by_stat(
            db,
            team_code,
            "big_chances_created",
            "integer",
            "big_chances_created",
            limit,
        ),
    }
    logger.info(
        {
            "message": "Fetched team top performers",
            "team_code": team_code,
            "limit": limit,
        }
    )
    return performers


CLASSIFICATION_POSITION_MAP = {
    PlayerClassification.G: "GK",
    PlayerClassification.D: "DEF",
    PlayerClassification.M: "MID",
    PlayerClassification.F: "FWD",
}


def _resolve_player_position(
    positions: str | None,
    classification: PlayerClassification | None,
) -> str:
    logger.info(
        {
            "message": "Resolving player position for search payload",
            "positions": positions,
            "classification": getattr(classification, "value", None) if classification else None,
        }
    )
    if positions and isinstance(positions, str) and positions.strip():
        position = positions.split(",")[0].strip()
        logger.info(
            {
                "message": "Resolved player position from positions field",
                "position": position,
            }
        )
        return position

    if classification is not None:
        position = CLASSIFICATION_POSITION_MAP.get(classification, "FWD")
        logger.info(
            {
                "message": "Resolved player position from classification fallback",
                "position": position,
            }
        )
        return position

    logger.info({"message": "Defaulting player position to empty string"})
    return ""


def search_players_by_name(db: Session, query: str, limit: int = 5) -> list[dict]:
    logger.info(
        {
            "message": "Searching players by name",
            "query": query,
            "limit": limit,
        }
    )
    search_term = query.strip()
    if not search_term:
        logger.info({"message": "Empty player search query; returning no results"})
        return []

    similarity_expression = sa.func.similarity(
        sa.func.coalesce(Player.name, ""),
        search_term,
    )
    tsvector_expression = sa.func.to_tsvector(
        "english",
        sa.func.coalesce(Player.name, ""),
    )
    tsquery_expression = sa.func.plainto_tsquery("english", search_term)
    ilike_pattern = f"%{search_term}%"
    prefix_pattern = f"{search_term}%"

    db_query = (
        db.query(Player)
        .filter(
            sa.or_(
                Player.name.ilike(ilike_pattern),
                similarity_expression >= 0.2,
                tsvector_expression.op("@@")(tsquery_expression),
            )
        )
        .order_by(
            sa.case((sa.func.lower(Player.name) == search_term.lower(), 0), else_=1),
            sa.case((Player.name.ilike(prefix_pattern), 0), else_=1),
            similarity_expression.desc(),
            Player.name.asc(),
        )
        .limit(limit)
    )
    players = db_query.all()
    logger.info(
        {
            "message": "Fetched players by fuzzy name search",
            "query": search_term,
            "limit": limit,
            "count": len(players),
        }
    )

    payload = []
    for player in players:
        payload.append(
            {
                "id": player.id,
                "name": player.name,
                "country_code": player.country_code or "",
                "position": _resolve_player_position(player.positions, player.classification),
                "image_url": f"/players/{player.id}/image",
            }
        )

    logger.info(
        {
            "message": "Built player search payload",
            "query": search_term,
            "limit": limit,
            "count": len(payload),
        }
    )
    return payload


def get_players_leaderboard(
    db: Session,
    limit: int,
    search: str | None = None,
    classification: PlayerClassification | None = None,
):
    logger.info(
        {
            "message": "Fetching players leaderboard",
            "limit": limit,
            "search": search,
            "classification": getattr(classification, "value", None) if classification else None,
        }
    )
    rating_expression = sa.literal_column(
        "coalesce((players.stats_json ->> 'rating')::double precision, 0)"
    )
    query = (
        db.query(Player, Team.logo_url, Team.group)
        .outerjoin(Team, Player.country_code == Team.code)
    )

    if search:
        search_term = search.strip()
        if search_term:
            query = query.filter(
                sa.func.to_tsvector(
                    "english",
                    sa.func.coalesce(Player.name, ""),
                ).op("@@")(
                    sa.func.plainto_tsquery("english", search_term)
                )
            )

    if classification is not None:
        query = query.filter(Player.classification == classification)

    rows = (
        query.order_by(rating_expression.desc(), Player.id.asc())
        .limit(limit)
        .all()
    )
    logger.info(
        {
            "message": "Fetched players leaderboard",
            "count": len(rows),
            "limit": limit,
            "search": search,
            "classification": getattr(classification, "value", None) if classification else None,
        }
    )
    payload = []
    for player, team_image, group in rows:
        stats_json = player.stats_json or {}
        if isinstance(stats_json, str):
            import json

            stats_json = json.loads(stats_json)

        payload.append(
            {
                "id": player.id,
                "player_name": player.name,
                "country_code": player.country_code,
                "classification": player.classification,
                "team_image": team_image,
                "group": group,
                "image_url": player.image_url,
                "statistics": {
                    "appearances": int(stats_json.get("appearances", 0) or 0),
                    "minutes_played": int(stats_json.get("minutes_played", 0) or 0),
                    "clean_sheets": int(stats_json.get("clean_sheet", 0) or 0),
                    "saves": int(stats_json.get("saves", 0) or 0),
                    "goals": int(stats_json.get("goals", 0) or 0),
                    "assists": int(stats_json.get("assists", 0) or 0),
                    "expected_goals": float(stats_json.get("expected_goals", 0) or 0),
                    "expected_assists": float(stats_json.get("expected_assists", 0) or 0),
                    "rating": float(stats_json.get("rating", 0) or 0),
                },
            }
        )

    logger.info(
        {
            "message": "Built players leaderboard payload",
            "count": len(payload),
            "limit": limit,
            "search": search,
            "classification": getattr(classification, "value", None) if classification else None,
        }
    )
    return payload


POSITION_CODE_TO_RADAR_ROLE = {
    "GK": "GK",
    "CB": "CB",
    "LB": "FB",
    "RB": "FB",
    "LWB": "FB",
    "RWB": "FB",
    "WB": "FB",
    "DM": "DM",
    "CM": "CM",
    "AM": "AMW",
    "LW": "AMW",
    "RW": "AMW",
    "W": "AMW",
    "SS": "AMW",
    "ST": "ST",
    "CF": "ST",
    "FW": "ST",
    "F": "ST",
}

CLASSIFICATION_TO_RADAR_ROLE = {
    "G": "GK",
    "D": "CB",
    "M": "CM",
    "F": "ST",
}

def get_radar_role(positions: str | None, classification: str | None) -> str:
    logger.info(
        {
            "message": "Resolving radar role",
            "positions": positions,
            "classification": classification,
        }
    )
    if positions and isinstance(positions, str) and positions.strip():
        first_pos = positions.split(",")[0].strip().upper()
        role = POSITION_CODE_TO_RADAR_ROLE.get(first_pos)
        if role:
            logger.info(
                {
                    "message": "Resolved radar role from positions",
                    "positions": positions,
                    "first_position": first_pos,
                    "resolved_role": role,
                }
            )
            return role
    
    if classification:
        val = getattr(classification, "value", classification)
        role = CLASSIFICATION_TO_RADAR_ROLE.get(val, "ST")
        logger.info(
            {
                "message": "Resolved radar role from classification fallback",
                "classification": val,
                "resolved_role": role,
            }
        )
        return role

    logger.info(
        {
            "message": "Defaulting radar role to ST",
            "resolved_role": "ST",
        }
    )
    return "ST"

def get_radar_peers_by_role(db: Session, role: str) -> list[dict]:
    logger.info(
        {
            "message": "Fetching radar peers by role",
            "role": role,
        }
    )
    
    classification_map = {
        "GK": ["G"],
        "CB": ["D"],
        "FB": ["D"],
        "DM": ["M"],
        "CM": ["M"],
        "AMW": ["M", "F"],
        "ST": ["F"],
    }
    
    classifications = classification_map.get(role, ["G", "D", "M", "F"])
    
    from db.models.players import PlayerClassification
    enum_classes = []
    for c in classifications:
        try:
            enum_classes.append(PlayerClassification[c])
        except KeyError:
            pass
            
    query = db.query(Player).filter(Player.classification.in_(enum_classes))
    players = query.all()
    
    peers_payload = []
    for player in players:
        stats_json = player.stats_json or {}
        if isinstance(stats_json, str):
            import json
            stats_json = json.loads(stats_json)
            
        minutes = int(stats_json.get("minutes_played", 0) or 0)
        if minutes < 270:
            continue
            
        p_class = player.classification.value if player.classification else None
        p_role = get_radar_role(player.positions, p_class)
        if p_role != role:
            continue
            
        peers_payload.append({
            "id": str(player.id),
            "name": player.name,
            "radarRole": p_role,
            "statistics": stats_json
        })
        
    logger.info(
        {
            "message": "Successfully fetched radar peers",
            "role": role,
            "count": len(peers_payload),
        }
    )
    return peers_payload

