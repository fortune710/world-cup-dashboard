from sqlalchemy import BigInteger, Boolean, Column, DateTime, Integer, SmallInteger, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB

from config.db import Base


class HistoricalMatch(Base):
    """
    A past World Cup knockout match, backfilled from Sofascore's cup tree.

    Scoped to the match-outcome ML training corpus — kept separate from the
    live app's `matches` table so training data never affects what the
    bracket page displays.
    """

    __tablename__ = "historical_matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_year = Column(SmallInteger, nullable=False, index=True)
    season_id = Column(Integer, nullable=False)
    round = Column(String, nullable=False)
    home_team_code = Column(String, nullable=False, index=True)
    away_team_code = Column(String, nullable=False, index=True)
    home_score = Column(SmallInteger, nullable=True)
    away_score = Column(SmallInteger, nullable=True)
    home_pen = Column(SmallInteger, nullable=True)
    away_pen = Column(SmallInteger, nullable=True)
    sofascore_event_id = Column(BigInteger, nullable=True, unique=True, index=True)

    # Populated by the detail-fetch stage: Match(api, sofascore_event_id).get_match()
    # for kickoff_utc, plus .stats() / .h2h() / .pre_match_form() bundled together.
    kickoff_utc = Column(DateTime, nullable=True, index=True)
    sofascore_detail = Column(JSONB, nullable=True)
    detail_indexed = Column(Boolean, default=False, nullable=False, server_default="false", index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("tournament_year", "home_team_code", "away_team_code", "round", name="uq_historical_match"),
    )
