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
    logger.info("Updating player stats for id: %d", player_id)
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if db_player:
        db_player.rating = rating
        db_player.stats_json = stats_json
        db.commit()
        db.refresh(db_player)
    return db_player

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


def _get_top_players_by_stat(db: Session, stat_key: str, cast_sql: str, stat_label: str):
    logger.info(
        {
            "message": "Fetching top players by stat",
            "stat_key": stat_key,
            "stat_label": stat_label,
            "limit": 5,
        }
    )
    stat_expression = sa.literal_column(
        f"coalesce((players.stats_json ->> '{stat_key}')::{cast_sql}, 0)"
    )
    players = (
        db.query(Player)
        .order_by(stat_expression.desc(), Player.id.asc())
        .limit(5)
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


def get_top_players_by_goals(db: Session):
    return _get_top_players_by_stat(db, "goals", "integer", "goals")


def get_top_players_by_assists(db: Session):
    return _get_top_players_by_stat(db, "assists", "integer", "assists")


def get_top_players_by_rating(db: Session):
    return _get_top_players_by_stat(db, "rating", "double precision", "rating")


def get_top_players_by_clean_sheets(db: Session):
    return _get_top_players_by_stat(db, "clean_sheet", "integer", "clean_sheets")


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
                "team_image": team_image,
                "group": group,
                "statistics": {
                    "appearances": int(stats_json.get("appearances", 0) or 0),
                    "minutes_played": int(stats_json.get("minutes_played", 0) or 0),
                    "clean_sheets": int(stats_json.get("clean_sheet", 0) or 0),
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
