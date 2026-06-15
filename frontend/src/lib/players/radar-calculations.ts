import type { RadarRole } from "./player-mapping";
import type { PlayerStatistics } from "@/types/player-statistics";
import { getTemplateForRole, RADAR_MINUTE_TIERS, type MetricType } from "./radar-metrics";

export interface RadarSpokeValue {
  key: string;
  label: string;
  rawValue: number | null;    // the computed per-90/percentage/rate value
  percentile: number | null;  // null until Phase 4 adds peer comparison
  higherIsBetter: boolean;
  description: string;
}

export interface RadarData {
  role: RadarRole;
  minutesPlayed: number;
  tier: "insufficient" | "show_only" | "percentile_ready" | "full_confidence";
  spokes: RadarSpokeValue[];
}

export function computeSpokeRawValue(
  statistics: PlayerStatistics,
  key: string,
  type: MetricType,
  statField: keyof PlayerStatistics,
  minutesPlayed: number
): number | null {
  let rawValue: number | null = null;

  if (type === "percentage") {
    const val = statistics[statField];
    rawValue = (val === null || val === undefined) ? null : val;
  } else if (type === "per90") {
    if (key === "tack_int_p90") {
      const tackles = statistics.tackles;
      const interceptions = statistics.interceptions;
      if ((tackles === null || tackles === undefined) && (interceptions === null || interceptions === undefined)) {
        rawValue = null;
      } else {
        const tVal = tackles ?? 0;
        const iVal = interceptions ?? 0;
        rawValue = minutesPlayed > 0 ? ((tVal + iVal) / minutesPlayed) * 90 : null;
      }
    } else if (key === "goal_contrib_p90") {
      const goals = statistics.goals;
      const assists = statistics.assists;
      if ((goals === null || goals === undefined) && (assists === null || assists === undefined)) {
        rawValue = null;
      } else {
        const gVal = goals ?? 0;
        const aVal = assists ?? 0;
        rawValue = minutesPlayed > 0 ? ((gVal + aVal) / minutesPlayed) * 90 : null;
      }
    } else {
      const val = statistics[statField];
      if (val === null || val === undefined) {
        rawValue = null;
      } else {
        rawValue = minutesPlayed > 0 ? (val / minutesPlayed) * 90 : null;
      }
    }
  } else if (type === "rate") {
    if (key === "penalty_save_r") {
      const penaltySave = statistics.penalty_save;
      const penaltyFaced = statistics.penalty_faced;
      if (!penaltyFaced || penaltySave === null || penaltySave === undefined) {
        rawValue = null;
      } else {
        rawValue = penaltySave / penaltyFaced;
      }
    } else if (key === "shot_acc") {
      const shotsOnTarget = statistics.shots_on_target;
      const totalShots = statistics.total_shots;
      if (!totalShots || shotsOnTarget === null || shotsOnTarget === undefined) {
        rawValue = null;
      } else {
        rawValue = shotsOnTarget / totalShots;
      }
    } else if (key === "conversion") {
      const goals = statistics.goals;
      const shotsOnTarget = statistics.shots_on_target;
      if (!shotsOnTarget || goals === null || goals === undefined) {
        rawValue = null;
      } else {
        rawValue = goals / shotsOnTarget;
      }
    }
  }

  // Safety checks: return null for NaN, Infinity, or -Infinity
  if (rawValue !== null && (!Number.isFinite(rawValue) || Number.isNaN(rawValue))) {
    rawValue = null;
  }

  return rawValue;
}

export function computeRadarData(
  statistics: PlayerStatistics,
  role: RadarRole
): RadarData {
  const minutesPlayed = statistics.minutes_played ?? 0;

  let tier: RadarData["tier"];
  if (minutesPlayed < RADAR_MINUTE_TIERS.MINIMUM_SHOW) {
    tier = "insufficient";
  } else if (minutesPlayed < RADAR_MINUTE_TIERS.PERCENTILE_ENABLE) {
    tier = "show_only";
  } else if (minutesPlayed < RADAR_MINUTE_TIERS.FULL_CONFIDENCE) {
    tier = "percentile_ready";
  } else {
    tier = "full_confidence";
  }

  if (tier === "insufficient") {
    return {
      role,
      minutesPlayed,
      tier,
      spokes: [],
    };
  }

  const template = getTemplateForRole(role);
  const spokes: RadarSpokeValue[] = template.metrics.map((metric) => {
    const rawValue = computeSpokeRawValue(
      statistics,
      metric.key,
      metric.type,
      metric.statField,
      minutesPlayed
    );

    return {
      key: metric.key,
      label: metric.label,
      rawValue,
      percentile: null,
      higherIsBetter: metric.higherIsBetter,
      description: metric.description,
    };
  });

  return {
    role,
    minutesPlayed,
    tier,
    spokes,
  };
}
