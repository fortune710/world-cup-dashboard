from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, func

from config.db import Base


class TrainingExample(Base):
    """
    One row per historical (2010-2022) World Cup knockout match, holding every
    materialized feature plus the label. Built by
    `pipeline/ml/match_outcome/features/build.py`; consumed by a future training job.
    """
    __tablename__ = "training_examples"

    id = Column(Integer, primary_key=True, index=True)
    historical_match_id = Column(
        Integer, ForeignKey("historical_matches.id"), nullable=False, unique=True, index=True
    )
    tournament_year = Column(Integer, nullable=False, index=True)
    round = Column(String, nullable=False)
    kickoff_utc = Column(DateTime, nullable=False)
    home_team_code = Column(String, nullable=False, index=True)
    away_team_code = Column(String, nullable=False, index=True)

    home_elo = Column(Float, nullable=False)
    away_elo = Column(Float, nullable=False)
    elo_diff = Column(Float, nullable=False)
    elo_delta_home = Column(Float, nullable=True)
    elo_delta_away = Column(Float, nullable=True)

    home_fifa_rank = Column(Integer, nullable=True)
    away_fifa_rank = Column(Integer, nullable=True)

    home_goals_scored_l5 = Column(Float, nullable=True)
    home_goals_conceded_l5 = Column(Float, nullable=True)
    home_wins_l5 = Column(Integer, nullable=True)
    home_draws_l5 = Column(Integer, nullable=True)
    away_goals_scored_l5 = Column(Float, nullable=True)
    away_goals_conceded_l5 = Column(Float, nullable=True)
    away_wins_l5 = Column(Integer, nullable=True)
    away_draws_l5 = Column(Integer, nullable=True)

    home_xg_for_l5 = Column(Float, nullable=True)
    home_xg_against_l5 = Column(Float, nullable=True)
    away_xg_for_l5 = Column(Float, nullable=True)
    away_xg_against_l5 = Column(Float, nullable=True)

    stage_weight = Column(Float, nullable=False)
    is_neutral = Column(Boolean, nullable=False, default=True)
    is_host = Column(Boolean, nullable=False, default=False)

    h2h_wins_home = Column(Integer, nullable=True)
    h2h_wins_away = Column(Integer, nullable=True)
    h2h_draws = Column(Integer, nullable=True)

    days_rest_home = Column(Integer, nullable=True)
    days_rest_away = Column(Integer, nullable=True)

    avg_player_rating_home = Column(Float, nullable=True)
    avg_player_rating_away = Column(Float, nullable=True)

    injured_key_players_home = Column(Boolean, nullable=False, default=False)
    injured_key_players_away = Column(Boolean, nullable=False, default=False)

    tournament_goals_scored_home = Column(Float, nullable=True)
    tournament_goals_conceded_home = Column(Float, nullable=True)
    tournament_wins_home = Column(Integer, nullable=True)
    tournament_draws_home = Column(Integer, nullable=True)
    tournament_goals_scored_away = Column(Float, nullable=True)
    tournament_goals_conceded_away = Column(Float, nullable=True)
    tournament_wins_away = Column(Integer, nullable=True)
    tournament_draws_away = Column(Integer, nullable=True)

    label_home_advanced = Column(Boolean, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
