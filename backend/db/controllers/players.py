from sqlalchemy.orm import Session
from db.models.players import Player, upsert_players_batch

def upsert_player(db: Session, player_data: dict):
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
    return db.query(Player).filter(Player.id == player_id).first()


def upsert_players(db: Session, players_data: list[dict]) -> int:
    return upsert_players_batch(db, players_data)

def update_player_stats(db: Session, player_id: int, rating: float, stats_json: dict):
    """
    Updates only the statistics of a player.
    """
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
    return db.query(Player).filter(Player.country_code == team_code).all()
