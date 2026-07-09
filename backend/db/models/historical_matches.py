from sqlalchemy import BigInteger, Boolean, Column, DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB

from config.db import Base


class HistoricalMatch(Base):
    """
    Raw World Cup knockout-match facts backfilled from Sofascore for tournaments
    prior to WC26 (2010-2022). Deliberately not FK'd to `teams.code` -- historical
    rosters include teams absent from the WC26-only `teams` table.
    """
    __tablename__ = "historical_matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_year = Column(Integer, nullable=False, index=True)
    season_id = Column(Integer, nullable=False, index=True)
    round = Column(String, nullable=False)
    home_team_code = Column(String, nullable=False, index=True)
    away_team_code = Column(String, nullable=False, index=True)
    home_team_name = Column(String, nullable=False)
    away_team_name = Column(String, nullable=False)
    kickoff_utc = Column(DateTime, nullable=False, index=True)
    home_score = Column(Integer, nullable=False, default=0)
    away_score = Column(Integer, nullable=False, default=0)
    home_pen = Column(Integer, nullable=True)
    away_pen = Column(Integer, nullable=True)
    sofascore_id = Column(BigInteger, nullable=True, unique=True, index=True)
    detail_json = Column(JSONB, nullable=True)
    detail_indexed = Column(Boolean, default=False, nullable=False, server_default="false", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "season_id", "home_team_code", "away_team_code", "round",
            name="uq_historical_matches_season_teams_round",
        ),
    )
