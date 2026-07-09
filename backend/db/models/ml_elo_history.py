from sqlalchemy import Column, DateTime, Float, Integer, String, func

from config.db import Base


class MlEloHistory(Base):
    """
    Elo replay history used only for ML feature building. Unlike `TeamEloHistory`,
    this replay unions `historical_matches` and `matches`, so a source match is
    identified by (source_match_table, source_match_id) rather than a single FK --
    never written by the live app, never read by the bracket page.
    """
    __tablename__ = "ml_elo_history"

    id = Column(Integer, primary_key=True, index=True)
    source_match_table = Column(String, nullable=False, index=True)
    source_match_id = Column(Integer, nullable=False, index=True)
    match_date = Column(DateTime, nullable=False, index=True)
    team_code = Column(String, nullable=False, index=True)
    opponent_code = Column(String, nullable=False)
    rating_before = Column(Float, nullable=False)
    rating_after = Column(Float, nullable=False)
    rating_delta = Column(Float, nullable=False)
    expected_score = Column(Float, nullable=False)
    actual_score = Column(Float, nullable=False)
    stage_weight = Column(Float, nullable=False)
    margin_multiplier = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
