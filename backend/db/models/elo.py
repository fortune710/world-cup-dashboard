from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from config.db import Base


class TeamEloHistory(Base):
    __tablename__ = "team_elo_history"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    team_code = Column(String, ForeignKey("teams.code"), nullable=False, index=True)
    opponent_code = Column(String, ForeignKey("teams.code"), nullable=False)
    rating_before = Column(Float, nullable=False)
    rating_after = Column(Float, nullable=False)
    rating_delta = Column(Float, nullable=False)
    expected_score = Column(Float, nullable=False)
    actual_score = Column(Float, nullable=False)
    stage_weight = Column(Float, nullable=False)
    margin_multiplier = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
