export interface PlayerStatistics {
  // Attacking
  goals?: number | null;
  assists?: number | null;
  expected_goals?: number | null;
  expected_assists?: number | null;
  total_shots?: number | null;
  shots_on_target?: number | null;
  big_chances_missed?: number | null;
  successful_dribbles?: number | null;
  accurate_crosses?: number | null;
  key_passes?: number | null;

  // Passing
  accurate_passes?: number | null;
  total_passes?: number | null;
  accurate_passes_percentage?: number | null;
  accurate_long_balls?: number | null;
  accurate_long_balls_percentage?: number | null;
  accurate_final_third_passes?: number | null;

  // Defensive
  tackles?: number | null;
  tackles_won?: number | null;
  tackles_won_percentage?: number | null;
  interceptions?: number | null;
  clearances?: number | null;
  blocked_shots?: number | null;
  dribbled_past?: number | null;
  aerial_duels_won?: number | null;
  aerial_duels_won_percentage?: number | null;

  // Goalkeeping
  saves?: number | null;
  goals_prevented?: number | null;
  clean_sheet?: number | null;
  penalty_save?: number | null;
  penalty_faced?: number | null;
  high_claims?: number | null;
  runs_out?: number | null;
  successful_runs_out?: number | null;

  // General
  minutes_played?: number | null;
  rating?: number | null;
}
