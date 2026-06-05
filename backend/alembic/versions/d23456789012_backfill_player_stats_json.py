"""backfill player stats json nulls

Revision ID: d23456789012
Revises: c12345678901
Create Date: 2026-06-05 04:42:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json

# revision identifiers, used by Alembic.
revision = 'd23456789012'
down_revision = 'c12345678901'
branch_labels = None
depends_on = None

def upgrade() -> None:
    default_stats = {
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
    }
    
    bind = op.get_bind()
    # Batch update players with null stats_json
    bind.execute(
        sa.text("UPDATE players SET stats_json = :default_stats WHERE stats_json IS NULL"),
        {"default_stats": json.dumps(default_stats)}
    )

def downgrade() -> None:
    # We don't necessarily want to nullify data on downgrade, 
    # but if we must, we'd only do it for those that were set to default.
    # However, it's safer to do nothing or just pass.
    pass
