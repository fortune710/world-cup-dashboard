import type { RadarRole } from "./player-mapping";
import type { PlayerStatistics } from "@/types/player-statistics";

export type MetricType = "per90" | "percentage" | "rate" | "absolute";

export interface RadarMetric {
  key: string;                          // unique identifier for this spoke
  label: string;                        // human-readable label shown on radar
  type: MetricType;
  statField: keyof PlayerStatistics;    // field to read from PlayerStatistics
  denominatorField?: keyof PlayerStatistics;  // denominator for "rate" metrics (e.g. total_shots for shot_acc)
  additiveField?: keyof PlayerStatistics;     // second field summed before per90 division (e.g. assists for goal_contrib)
  higherIsBetter: boolean;              // false for metrics like goals_conceded
  description: string;                  // tooltip text explaining the metric
}

export type RadarTemplate = {
  role: RadarRole;
  metrics: RadarMetric[];
};

const GK_TEMPLATE: RadarTemplate = {
  role: "GK",
  metrics: [
    { key: "saves_p90",       label: "Saves",            type: "per90",      statField: "saves",                       higherIsBetter: true,  description: "Saves per 90 minutes" },
    { key: "goals_prevented", label: "Goals Prevented",  type: "per90",      statField: "goals_prevented",             higherIsBetter: true,  description: "Goals prevented per 90 (saves above expected)" },
    { key: "clean_sheets",    label: "Clean Sheets",     type: "per90",      statField: "clean_sheet",                 higherIsBetter: true,  description: "Clean sheets per 90 minutes" },
    { key: "penalty_save_r",  label: "Pen Save Rate",    type: "rate",       statField: "penalty_save",  denominatorField: "penalty_faced",  higherIsBetter: true,  description: "Penalties saved / penalties faced" },
    { key: "high_claims_p90", label: "High Claims",      type: "per90",      statField: "high_claims",                 higherIsBetter: true,  description: "High claims per 90 minutes" },
    { key: "long_ball_acc",   label: "Long Ball %",      type: "percentage", statField: "accurate_long_balls_percentage", higherIsBetter: true, description: "Long ball accuracy percentage" },
    { key: "pass_acc",        label: "Pass Accuracy",    type: "percentage", statField: "accurate_passes_percentage",  higherIsBetter: true,  description: "Pass accuracy percentage" },
    { key: "rating",          label: "Rating",           type: "absolute",      statField: "rating",                      higherIsBetter: true,  description: "Average match rating" },
  ]
};

const CB_TEMPLATE: RadarTemplate = {
  role: "CB",
  metrics: [
    { key: "tack_int_p90",    label: "Tackles + Int",    type: "per90",      statField: "tackles",  additiveField: "interceptions",  higherIsBetter: true,  description: "Tackles and interceptions per 90 (sum)" },
    { key: "aerial_win_pct",  label: "Aerial Win %",     type: "percentage", statField: "aerial_duels_won_percentage", higherIsBetter: true,  description: "Aerial duels won percentage" },
    { key: "clearances_p90",  label: "Clearances",       type: "per90",      statField: "clearances",                  higherIsBetter: true,  description: "Clearances per 90 minutes" },
    { key: "blocks_p90",      label: "Blocks",           type: "per90",      statField: "blocked_shots",               higherIsBetter: true,  description: "Blocked shots per 90 minutes" },
    { key: "tackle_win_pct",  label: "Tackle Win %",     type: "percentage", statField: "tackles_won_percentage",      higherIsBetter: true,  description: "Percentage of tackles won" },
    { key: "pass_acc",        label: "Pass Accuracy",    type: "percentage", statField: "accurate_passes_percentage",  higherIsBetter: true,  description: "Pass accuracy percentage" },
    { key: "long_ball_acc",   label: "Long Ball %",      type: "percentage", statField: "accurate_long_balls_percentage", higherIsBetter: true, description: "Long ball accuracy percentage" },
    { key: "rating",          label: "Rating",           type: "absolute",      statField: "rating",                      higherIsBetter: true,  description: "Average match rating" },
  ]
};

const FB_TEMPLATE: RadarTemplate = {
  role: "FB",
  metrics: [
    { key: "tack_int_p90",    label: "Tackles + Int",    type: "per90",      statField: "tackles",  additiveField: "interceptions",  higherIsBetter: true,  description: "Tackles and interceptions per 90" },
    { key: "crosses_p90",     label: "Crosses",          type: "per90",      statField: "accurate_crosses",            higherIsBetter: true,  description: "Accurate crosses per 90 minutes" },
    { key: "final3_p90",      label: "Final 3rd Passes", type: "per90",      statField: "accurate_final_third_passes", higherIsBetter: true,  description: "Accurate passes into final third per 90" },
    { key: "key_passes_p90",  label: "Key Passes",       type: "per90",      statField: "key_passes",                  higherIsBetter: true,  description: "Key passes per 90 minutes" },
    { key: "dribbles_p90",    label: "Dribbles",         type: "per90",      statField: "successful_dribbles",         higherIsBetter: true,  description: "Successful dribbles per 90 minutes" },
    { key: "xa_p90",          label: "xA",               type: "per90",      statField: "expected_assists",            higherIsBetter: true,  description: "Expected assists per 90 minutes" },
    { key: "long_ball_acc",   label: "Long Ball %",      type: "percentage", statField: "accurate_long_balls_percentage", higherIsBetter: true, description: "Long ball accuracy percentage" },
    { key: "rating",          label: "Rating",           type: "absolute",      statField: "rating",                      higherIsBetter: true,  description: "Average match rating" },
  ]
};

const DM_TEMPLATE: RadarTemplate = {
  role: "DM",
  metrics: [
    { key: "tack_int_p90",    label: "Tackles + Int",    type: "per90",      statField: "tackles",  additiveField: "interceptions",  higherIsBetter: true,  description: "Tackles and interceptions per 90" },
    { key: "tackle_win_pct",  label: "Tackle Win %",     type: "percentage", statField: "tackles_won_percentage",      higherIsBetter: true,  description: "Percentage of tackles won" },
    { key: "aerial_win_pct",  label: "Aerial Win %",     type: "percentage", statField: "aerial_duels_won_percentage", higherIsBetter: true,  description: "Aerial duels won percentage" },
    { key: "interceptions_p90", label: "Interceptions",  type: "per90",      statField: "interceptions",               higherIsBetter: true,  description: "Interceptions per 90 minutes" },
    { key: "pass_acc",        label: "Pass Accuracy",    type: "percentage", statField: "accurate_passes_percentage",  higherIsBetter: true,  description: "Pass accuracy percentage" },
    { key: "long_ball_acc",   label: "Long Ball %",      type: "percentage", statField: "accurate_long_balls_percentage", higherIsBetter: true, description: "Long ball accuracy percentage" },
    { key: "xa_p90",          label: "xA",               type: "per90",      statField: "expected_assists",            higherIsBetter: true,  description: "Expected assists per 90 minutes" },
    { key: "rating",          label: "Rating",           type: "absolute",      statField: "rating",                      higherIsBetter: true,  description: "Average match rating" },
  ]
};

const CM_TEMPLATE: RadarTemplate = {
  role: "CM",
  metrics: [
    { key: "pass_acc",        label: "Pass Accuracy",    type: "percentage", statField: "accurate_passes_percentage",  higherIsBetter: true,  description: "Pass accuracy percentage" },
    { key: "final3_p90",      label: "Final 3rd Passes", type: "per90",      statField: "accurate_final_third_passes", higherIsBetter: true,  description: "Accurate passes into final third per 90" },
    { key: "key_passes_p90",  label: "Key Passes",       type: "per90",      statField: "key_passes",                  higherIsBetter: true,  description: "Key passes per 90 minutes" },
    { key: "xa_p90",          label: "xA",               type: "per90",      statField: "expected_assists",            higherIsBetter: true,  description: "Expected assists per 90 minutes" },
    { key: "assists_p90",     label: "Assists",          type: "per90",      statField: "assists",                     higherIsBetter: true,  description: "Assists per 90 minutes" },
    { key: "tack_int_p90",    label: "Tackles + Int",    type: "per90",      statField: "tackles",  additiveField: "interceptions",  higherIsBetter: true,  description: "Tackles and interceptions per 90" },
    { key: "shots_p90",       label: "Shots",            type: "per90",      statField: "total_shots",                 higherIsBetter: true,  description: "Shots per 90 minutes" },
    { key: "rating",          label: "Rating",           type: "absolute",      statField: "rating",                      higherIsBetter: true,  description: "Average match rating" },
  ]
};

const AMW_TEMPLATE: RadarTemplate = {
  role: "AMW",
  metrics: [
    { key: "xg_p90",          label: "xG",               type: "per90",      statField: "expected_goals",              higherIsBetter: true,  description: "Expected goals per 90 minutes" },
    { key: "xa_p90",          label: "xA",               type: "per90",      statField: "expected_assists",            higherIsBetter: true,  description: "Expected assists per 90 minutes" },
    { key: "shots_p90",       label: "Shots",            type: "per90",      statField: "total_shots",                 higherIsBetter: true,  description: "Shots per 90 minutes" },
    { key: "key_passes_p90",  label: "Key Passes",       type: "per90",      statField: "key_passes",                  higherIsBetter: true,  description: "Key passes per 90 minutes" },
    { key: "dribbles_p90",    label: "Dribbles",         type: "per90",      statField: "successful_dribbles",         higherIsBetter: true,  description: "Successful dribbles per 90 minutes" },
    { key: "goal_contrib_p90",label: "Goal Contributions",type: "per90",     statField: "goals",  additiveField: "assists",  higherIsBetter: true,  description: "Goals + assists per 90 minutes" },
    { key: "assists_p90",     label: "Assists",          type: "per90",      statField: "assists",                     higherIsBetter: true,  description: "Assists per 90 minutes" },
    { key: "rating",          label: "Rating",           type: "absolute",      statField: "rating",                      higherIsBetter: true,  description: "Average match rating" },
  ]
};

const ST_TEMPLATE: RadarTemplate = {
  role: "ST",
  metrics: [
    { key: "xg_p90",          label: "xG",               type: "per90",      statField: "expected_goals",              higherIsBetter: true,  description: "Expected goals per 90 minutes" },
    { key: "goals_p90",       label: "Goals",            type: "per90",      statField: "goals",                       higherIsBetter: true,  description: "Goals per 90 minutes" },
    { key: "shots_p90",       label: "Shots",            type: "per90",      statField: "total_shots",                 higherIsBetter: true,  description: "Shots per 90 minutes" },
    { key: "shot_acc",        label: "Shot Accuracy",    type: "rate",       statField: "shots_on_target",  denominatorField: "total_shots",       higherIsBetter: true,  description: "Shots on target / total shots" },
    { key: "conversion",      label: "Conversion %",     type: "rate",       statField: "goals",            denominatorField: "shots_on_target",   higherIsBetter: true,  description: "Goals / shots on target" },
    { key: "big_ch_missed_p90",label: "Big Ch Missed",  type: "per90",      statField: "big_chances_missed",          higherIsBetter: false, description: "Big chances missed per 90 (lower is better)" },
    { key: "aerial_win_p90",  label: "Aerial Wins",      type: "per90",      statField: "aerial_duels_won",            higherIsBetter: true,  description: "Aerial duels won per 90 minutes" },
    { key: "rating",          label: "Rating",           type: "absolute",      statField: "rating",                      higherIsBetter: true,  description: "Average match rating" },
  ]
};

export const RADAR_TEMPLATES: Map<RadarRole, RadarTemplate> = new Map([
  ["GK",  GK_TEMPLATE],
  ["CB",  CB_TEMPLATE],
  ["FB",  FB_TEMPLATE],
  ["DM",  DM_TEMPLATE],
  ["CM",  CM_TEMPLATE],
  ["AMW", AMW_TEMPLATE],
  ["ST",  ST_TEMPLATE],
]);

export function getTemplateForRole(role: RadarRole): RadarTemplate {
  const template = RADAR_TEMPLATES.get(role);
  if (!template) throw new Error(`No radar template found for role: ${role}`);
  return template;
}

export const RADAR_MINUTE_TIERS = {
  MINIMUM_SHOW: 0,         // Unused now — we show radar at 0 min
  PERCENTILE_ENABLE: 90,   // ~1 match — below this: show values but not percentile rank
  FULL_CONFIDENCE: 360,    // ~4 matches — at or above this: full percentile rank display
} as const;
