from sqlalchemy import Column, Integer, String, Boolean, SmallInteger, Float
from config.db import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    logo_url = Column(String, nullable=True)
    group = Column(String, nullable=True, index=True)
    fifa_ranking = Column(SmallInteger, nullable=True)
    sofascore_id = Column(Integer, nullable=True, unique=True, index=True)
    goals_for = Column(SmallInteger, default=0)
    goals_against = Column(SmallInteger, default=0)
    position = Column(SmallInteger, default=0)
    points = Column(SmallInteger, default=0, index=True)
    matches_played = Column(SmallInteger, default=0)
    matches_won = Column(SmallInteger, default=0)
    matches_drawn = Column(SmallInteger, default=0)
    matches_lost = Column(SmallInteger, default=0)
    elo_rating = Column(Float, nullable=False, server_default="1500.0", index=True)
    players_indexed = Column(Boolean, default=False, index=True)
