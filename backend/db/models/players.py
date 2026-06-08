from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, String, Float, BigInteger, Date, Enum, SmallInteger, ForeignKey
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session
from config.db import Base
from db.models.teams import Team
import enum
import logging
from typing import Iterable, Mapping, Any

logger = logging.getLogger(__name__)

class PlayerClassification(enum.Enum):
    G = "G"
    D = "D"
    M = "M"
    F = "F"

class PlayerFoot(enum.Enum):
    Left = "Left"
    Right = "Right"
    Both = "Both"

class Player(Base):
    __tablename__ = "players"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, index=True)
    date_of_birth = Column(Date)
    classification = Column(Enum(PlayerClassification))
    club_name = Column(String, index=True)
    positions = Column(String)
    weight_kg = Column(SmallInteger)
    height_cm = Column(SmallInteger)
    foot = Column(Enum(PlayerFoot))
    country_code = Column(String(3), ForeignKey("teams.code"), index=True, unique=False)
    market_value = Column(BigInteger)
    image_url = Column(String, nullable=True)

    ## Statistics
    rating = Column(Float, index=True)
    stats_json = Column(JSONB, default=lambda: {
        "rating": 0,
        "total_rating": 0,
        "count_rating": 0,
        "goals": 0,
        "big_chances_created": 0,
        "big_chances_missed": 0,
        "assists": 0,
        "expected_assists": 0.0,
        "goals_assists_sum": 0,
        "accurate_passes": 0,
        "inaccurate_passes": 0,
        "total_passes": 0,
        "accurate_passes_percentage": 0,
        "accurate_own_half_passes": 0,
        "accurate_opposition_half_passes": 0,
        "accurate_final_third_passes": 0,
        "key_passes": 0,
        "successful_dribbles": 0,
        "successful_dribbles_percentage": 0,
        "tackles": 0,
        "interceptions": 0,
        "yellow_cards": 0,
        "direct_red_cards": 0,
        "red_cards": 0,
        "accurate_crosses": 0,
        "accurate_crosses_percentage": 0,
        "total_shots": 0,
        "shots_on_target": 0,
        "shots_off_target": 0,
        "ground_duels_won": 0,
        "ground_duels_won_percentage": 0,
        "aerial_duels_won": 0,
        "aerial_duels_won_percentage": 0,
        "total_duels_won": 0,
        "total_duels_won_percentage": 0,
        "minutes_played": 0,
        "goal_conversion_percentage": 0,
        "penalties_taken": 0,
        "penalty_goals": 0,
        "penalty_won": 0,
        "penalty_conceded": 0,
        "shot_from_set_piece": 0,
        "free_kick_goal": 0,
        "goals_from_inside_the_box": 0,
        "goals_from_outside_the_box": 0,
        "shots_from_inside_the_box": 0,
        "shots_from_outside_the_box": 0,
        "headed_goals": 0,
        "left_foot_goals": 0,
        "right_foot_goals": 0,
        "accurate_long_balls": 0,
        "accurate_long_balls_percentage": 0,
        "clearances": 0,
        "error_lead_to_goal": 0,
        "error_lead_to_shot": 0,
        "dispossessed": 0,
        "possession_lost": 0,
        "possession_won_att_third": 0,
        "total_chipped_passes": 0,
        "accurate_chipped_passes": 0,
        "touches": 0,
        "was_fouled": 0,
        "fouls": 0,
        "hit_woodwork": 0,
        "own_goals": 0,
        "dribbled_past": 0,
        "offsides": 0,
        "blocked_shots": 0,
        "pass_to_assist": 0,
        "saves": 0,
        "goals_prevented": 0.0,
        "clean_sheet": 0,
        "penalty_faced": 0,
        "penalty_save": 0,
        "saved_shots_from_inside_the_box": 0,
        "saved_shots_from_outside_the_box": 0,
        "goals_conceded_inside_the_box": 0,
        "goals_conceded_outside_the_box": 0,
        "punches": 0,
        "runs_out": 0,
        "successful_runs_out": 0,
        "high_claims": 0,
        "crosses_not_claimed": 0,
        "matches_started": 0,
        "penalty_conversion": 0,
        "set_piece_conversion": 0,
        "total_attempt_assist": 0,
        "total_contest": 0,
        "total_cross": 0,
        "duel_lost": 0,
        "aerial_lost": 0,
        "attempt_penalty_miss": 0,
        "attempt_penalty_post": 0,
        "attempt_penalty_target": 0,
        "total_long_balls": 0,
        "goals_conceded": 0,
        "tackles_won": 0,
        "tackles_won_percentage": 0,
        "scoring_frequency": 0,
        "yellow_red_cards": 0,
        "saves_caught": 0,
        "saves_parried": 0,
        "total_own_half_passes": 0,
        "total_opposition_half_passes": 0,
        "totw_appearances": 0,
        "expected_goals": 0.0,
        "goal_kicks": 0,
        "ball_recovery": 0,
        "outfielder_blocks": 0,
        "appearances": 0
    })

    from sqlalchemy import Index
    __table_args__ = (
        Index('ix_players_stats_goals', stats_json['goals'].astext.cast(SmallInteger)),
        Index('ix_players_stats_assists', stats_json['assists'].astext.cast(SmallInteger)),
        Index('ix_players_stats_expected_goals', stats_json['expected_goals'].astext.cast(Float)),
        Index('ix_players_stats_expected_assists', stats_json['expected_assists'].astext.cast(Float)),
        Index('ix_players_stats_clean_sheet', stats_json['clean_sheet'].astext.cast(SmallInteger)),
        Index('ix_players_stats_big_chances_created', stats_json['big_chances_created'].astext.cast(SmallInteger)),
    )


def upsert_players_batch(db: Session, players_data: Iterable[Mapping[str, Any]]) -> int:
    players_list = [dict(player) for player in players_data]
    if not players_list:
        logger.info({
            "message": "No players data provided for batch upsert",
            "count": 0,
        })
        return 0

    logger.info({
        "message": "Starting batch upsert for players",
        "count": len(players_list),
    })
    insert_query = insert(Player).values(players_list)
    update_columns = {
        column.name: getattr(insert_query.excluded, column.name)
        for column in Player.__table__.columns
    }

    upsert_query = insert_query.on_conflict_do_update(
        index_elements=["id"],
        set_=update_columns,
    )

    try:
        result = db.execute(upsert_query)
        db.commit()
        row_count = result.rowcount or 0
        logger.info({
            "message": "Successfully upserted players via conflict update",
            "count": row_count,
        })
        return row_count
    except ProgrammingError as exc:
        db.rollback()
        error_message = str(exc)
        if "there is no unique or exclusion constraint matching the ON CONFLICT specification" not in error_message:
            logger.error({
                "message": "Failed to batch upsert players",
                "error": {
                    "message": error_message,
                    "type": type(exc).__name__,
                },
            }, exc_info=True)
            raise

        logger.warning({
            "message": "Batch upsert conflict target missing; falling back to merge",
            "count": len(players_list),
            "error": {
                "message": error_message,
                "type": type(exc).__name__,
            },
        })

        merged_count = 0
        try:
            for player_data in players_list:
                db.merge(Player(**player_data))
                merged_count += 1

            db.commit()
            logger.info({
                "message": "Successfully upserted players via merge fallback",
                "count": merged_count,
            })
            return merged_count
        except Exception as fallback_exc:
            db.rollback()
            logger.error({
                "message": "Failed to merge player batch after conflict-upsert fallback",
                "count": len(players_list),
                "error": {
                    "message": str(fallback_exc),
                    "type": type(fallback_exc).__name__,
                },
            }, exc_info=True)
            raise
