from sqlalchemy import Column, Date, DateTime, Float, Integer, String, UniqueConstraint, func

from config.db import Base


class FifaRankingSnapshot(Base):
    """
    Point-in-time FIFA world ranking snapshots, sourced from the Dato-Futbol
    historical ranking dataset. One row per (team_code, as_of_date).
    """
    __tablename__ = "fifa_ranking_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    team_code = Column(String, nullable=False, index=True)
    team_name_raw = Column(String, nullable=False)
    as_of_date = Column(Date, nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    points = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("team_code", "as_of_date", name="uq_fifa_ranking_snapshot_team_date"),
    )
