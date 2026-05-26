from sqlalchemy import Column, String, Float, BigInteger, Date, Enum, SmallInteger, ForeignKey
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from config.db import Base
from db.models.teams import Team
import enum
from typing import Iterable, Mapping, Any

class PlayerClassification(enum.Enum):
    G = "G"
    D = "D"
    M = "M"
    F = "F"

class PlayerFoot(enum.Enum):
    Left = "Left"
    Right = "Right"
    Both = "Both"

class Player(Base):
    __tablename__ = "players"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, index=True)
    date_of_birth = Column(Date)
    classification = Column(Enum(PlayerClassification))
    club_name = Column(String, index=True)
    positions = Column(String)
    weight_kg = Column(SmallInteger)
    height_cm = Column(SmallInteger)
    foot = Column(Enum(PlayerFoot))
    country_code = Column(String(3), ForeignKey("teams.code"), index=True)
    market_value = Column(BigInteger)

    ## Statistics
    rating = Column(Float)


def upsert_players_batch(db: Session, players_data: Iterable[Mapping[str, Any]]) -> int:
    players_list = [dict(player) for player in players_data]
    if not players_list:
        return 0

    insert_stmt = insert(Player).values(players_list)
    update_columns = {
        column.name: getattr(insert_stmt.excluded, column.name)
        for column in Player.__table__.columns
        if column.name != "id"
    }

    upsert_stmt = insert_stmt.on_conflict_do_update(
        index_elements=[Player.id],
        set_=update_columns,
    )

    result = db.execute(upsert_stmt)
    db.commit()
    return result.rowcount or 0
