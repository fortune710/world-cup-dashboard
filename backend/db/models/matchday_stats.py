import json

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Float, Index, Integer, text
from sqlalchemy.dialects.postgresql import JSONB

from config.db import Base

MATCHDAY_STATS_STATISTICS_FIELDS = (
    "rating",
    "accurate_pass",
    "total_pass",
    "total_long_balls",
    "accurate_long_balls",
    "accurate_own_half_passes",
    "total_own_half_passes",
    "accurate_opposition_half_passes",
    "total_opposition_half_passes",
    "total_cross",
    "accurate_cross",
    "aerial_lost",
    "aerial_won",
    "duel_lost",
    "duel_won",
    "dispossessed",
    "shot_off_target",
    "total_clearance",
    "outfielder_block",
    "interception_won",
    "ball_recovery",
    "total_tackle",
    "won_tackle",
    "unsuccessful_touch",
    "was_fouled",
    "minutes_played",
    "touches",
    "possession_lost_ctrl",
    "expected_goals",
    "expected_assists",
    "total_ball_carries_distance",
    "ball_carries_count",
    "total_progression",
    "best_ball_carry_progression",
    "total_progressive_ball_carries_distance",
    "progressive_ball_carries_count",
    "key_pass",
    "total_shots",
    "shot_value_normalized",
    "pass_value_normalized",
    "dribble_value_normalized",
    "defensive_value_normalized",
    "field",
    "goal_contributions",
    "pass_accuracy",
)

MATCHDAY_STATS_STATISTIC_FIELDS = MATCHDAY_STATS_STATISTICS_FIELDS

MATCHDAY_STATS_DEFAULT_STATISTICS = {
    "rating": 0.0,
    "accurate_pass": 0,
    "total_pass": 0,
    "total_long_balls": 0,
    "accurate_long_balls": 0,
    "accurate_own_half_passes": 0,
    "total_own_half_passes": 0,
    "accurate_opposition_half_passes": 0,
    "total_opposition_half_passes": 0,
    "total_cross": 0,
    "accurate_cross": 0,
    "aerial_lost": 0,
    "aerial_won": 0,
    "duel_lost": 0,
    "duel_won": 0,
    "dispossessed": 0,
    "shot_off_target": 0,
    "total_clearance": 0,
    "outfielder_block": 0,
    "interception_won": 0,
    "ball_recovery": 0,
    "total_tackle": 0,
    "won_tackle": 0,
    "unsuccessful_touch": 0,
    "was_fouled": 0,
    "minutes_played": 0,
    "touches": 0,
    "possession_lost_ctrl": 0,
    "expected_goals": 0.0,
    "expected_assists": 0.0,
    "total_ball_carries_distance": 0.0,
    "ball_carries_count": 0,
    "total_progression": 0.0,
    "best_ball_carry_progression": 0.0,
    "total_progressive_ball_carries_distance": 0.0,
    "progressive_ball_carries_count": 0,
    "key_pass": 0,
    "total_shots": 0,
    "shot_value_normalized": 0.0,
    "pass_value_normalized": 0.0,
    "dribble_value_normalized": 0.0,
    "defensive_value_normalized": 0.0,
    "field": None,
    "goal_contributions": 0,
    "pass_accuracy": 0,
}


class MatchdayStats(Base):
    __tablename__ = "matchday_stats"
    DEFAULT_STATISTICS = MATCHDAY_STATS_DEFAULT_STATISTICS

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    player_id = Column(BigInteger, ForeignKey("players.id"))
    match_id = Column(BigInteger, ForeignKey("matches.sofascore_id"))
    match_date = Column(DateTime)
    statistics = Column(
        JSONB,
        nullable=True,
        default=lambda: dict(MATCHDAY_STATS_DEFAULT_STATISTICS),
        server_default=text(f"'{json.dumps(MATCHDAY_STATS_DEFAULT_STATISTICS)}'::jsonb"),
    )

    __table_args__ = (
        Index("ix_matchday_stats_player_id", player_id),
        Index("ix_matchday_stats_match_date", match_date),
        Index("ix_matchday_stats_match_id", match_id),
        Index("ix_matchday_stats_statistics_rating", statistics["rating"].astext.cast(Float)),
        Index(
            "ix_matchday_stats_statistics_goal_contributions",
            statistics["goal_contributions"].astext.cast(Integer),
        ),
        Index("ix_matchday_stats_statistics_pass_accuracy", statistics["pass_accuracy"].astext.cast(Integer)),
    )
