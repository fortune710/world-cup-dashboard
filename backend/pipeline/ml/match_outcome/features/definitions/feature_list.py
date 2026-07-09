"""
Canonical feature list for the knockout-round match-outcome model, materialized as
`training_examples` columns by `pipeline/ml/match_outcome/features/build.py`.

No FEATURES_CORE/FEATURES_OPTIONAL/FEATURES_V2 draft existed anywhere in the repo when
this was built (confirmed by grep) -- this list was derived directly from the feature
table in the historical-backfill plan. There is no optional tier: every feature below
is a required `training_examples` column.
"""

FEATURES_CORE = (
    "home_elo",
    "away_elo",
    "elo_diff",
    "elo_delta_home",
    "elo_delta_away",
    "home_fifa_rank",
    "away_fifa_rank",
    "home_goals_scored_l5",
    "home_goals_conceded_l5",
    "home_wins_l5",
    "home_draws_l5",
    "away_goals_scored_l5",
    "away_goals_conceded_l5",
    "away_wins_l5",
    "away_draws_l5",
    "home_xg_for_l5",
    "home_xg_against_l5",
    "away_xg_for_l5",
    "away_xg_against_l5",
    "stage_weight",
    "is_neutral",
    "is_host",
    "h2h_wins_home",
    "h2h_wins_away",
    "h2h_draws",
    "days_rest_home",
    "days_rest_away",
    "avg_player_rating_home",
    "avg_player_rating_away",
    "injured_key_players_home",
    "injured_key_players_away",
)

FEATURES_V2 = (
    "tournament_goals_scored_home",
    "tournament_goals_conceded_home",
    "tournament_wins_home",
    "tournament_draws_home",
    "tournament_goals_scored_away",
    "tournament_goals_conceded_away",
    "tournament_wins_away",
    "tournament_draws_away",
)

LABEL_COLUMN = "label_home_advanced"
