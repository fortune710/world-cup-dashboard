import logging
import sqlalchemy as sa
from sqlalchemy.orm import Session
from db.models.players import Player, upsert_players_batch

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
