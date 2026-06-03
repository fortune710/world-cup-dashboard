from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from config.db import Base
from db.models.teams import Team

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    round = Column(String)
    group = Column(String, nullable=True)
    home_team_code = Column(String, ForeignKey("teams.code"))
    away_team_code = Column(String, ForeignKey("teams.code"))
    stadium = Column(String)
    kickoff_utc = Column(DateTime, index=True)
    status = Column(String, index=True)
    phase = Column(String, nullable=True)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    home_pen = Column(Integer, nullable=True)
    away_pen = Column(Integer, nullable=True)
    
    home_team = relationship("Team", foreign_keys=[home_team_code])
    away_team = relationship("Team", foreign_keys=[away_team_code])
