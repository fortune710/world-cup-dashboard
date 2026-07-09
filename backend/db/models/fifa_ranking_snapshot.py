from sqlalchemy import Column, Date, DateTime, Float, Integer, SmallInteger, String, UniqueConstraint, func

from config.db import Base


class FifaRankingSnapshot(Base):
    """
    A team's FIFA world ranking as of a specific date.

    Point-in-time by design: `home_fifa_rank`/`away_fifa_rank` in the
    training feature set must reflect the ranking at each tournament's
    start, not today's ranking (the live app's `teams.fifa_ranking` column
    is a current-only snapshot and cannot be used for historical rows).
    """

    __tablename__ = "fifa_ranking_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    team_code = Column(String, nullable=False, index=True)
    as_of_date = Column(Date, nullable=False, index=True)
    rank = Column(SmallInteger, nullable=True)
    points = Column(Float, nullable=True)
    source_note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("team_code", "as_of_date", name="uq_fifa_ranking_snapshot"),)
