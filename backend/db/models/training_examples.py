from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, Integer, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import JSONB

from config.db import Base


class TrainingExample(Base):
    """
    One materialized feature row per historical knockout match, ready to
    hand to a training job. `features` holds every FEATURES_CORE /
    FEATURES_OPTIONAL / FEATURES_V2 key as a flat dict — a JSONB bag rather
    than one column per feature, mirroring `matchday_stats.statistics`, so
    the feature list can grow without a migration.
    """

    __tablename__ = "training_examples"

    id = Column(BigInteger, primary_key=True, index=True)
    historical_match_id = Column(Integer, ForeignKey("historical_matches.id"), nullable=False, unique=True, index=True)
    tournament_year = Column(SmallInteger, nullable=False, index=True)
    round = Column(String, nullable=False)
    home_team_code = Column(String, nullable=False)
    away_team_code = Column(String, nullable=False)
    kickoff_utc = Column(DateTime, nullable=True)
    features = Column(JSONB, nullable=False)
    label_home_advanced = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
