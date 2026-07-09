from sqlalchemy import Column, DateTime, Float, Integer, String, func

from config.db import Base


class MlEloHistory(Base):
    """
    Elo rating history for the match-outcome ML training corpus.

    Same shape as `db.models.elo.TeamEloHistory`, but produced by replaying
    `EloTransformations` over the full chronological union of
    `historical_matches` and the live `matches` table — the live table's own
    `team_elo_history` starts every team at 1500 with no historical seeding,
    which makes `elo_diff` meaningless for training rows. Kept in a separate
    table (rather than writing into `team_elo_history`) so this replay never
    overwrites the ratings the live app displays.

    `match_ref_id` is a loose reference (no FK) since it points at either
    `historical_matches.id` or `matches.id`, keyed by `source`.
    """

    __tablename__ = "ml_elo_history"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False, index=True)  # "historical" | "wc26"
    match_ref_id = Column(Integer, nullable=False, index=True)
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
