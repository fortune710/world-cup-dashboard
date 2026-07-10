import type { RadarRole } from "./player-mapping";
import type { PlayerStatistics } from "@/types/player-statistics";
import { getTemplateForRole, RADAR_MINUTE_TIERS, type RadarMetric, type MetricType } from "./radar-metrics";

export interface RadarSpokeValue {
  key: string;
  label: string;
  type: MetricType;
  rawValue: number | null;    // the computed per-90/percentage/rate value
  percentile: number | null;  // computed against peers
  averageValue?: number | null; // peer average
  higherIsBetter: boolean;
  description: string;
}

export interface RadarData {
  role: RadarRole;
  minutesPlayed: number;
  tier: "show_only" | "percentile_ready" | "full_confidence";
  spokes: RadarSpokeValue[];
}

/**
 * Compute the raw display value for a single radar spoke.
 *
 * Handles four metric types generically via the RadarMetric definition:
 * - "percentage" / "absolute": passthrough from statField
 * - "per90": (statField + additiveField?) / minutesPlayed * 90
 * - "rate": statField / denominatorField
 */
export function computeSpokeRawValue(
  statistics: PlayerStatistics,
  metric: RadarMetric,
  minutesPlayed: number
): number | null {
  const { type, statField } = metric;
  let rawValue: number | null = null;

  if (type === "percentage" || type === "absolute") {
    const val = statistics[statField];
    rawValue = (val === null || val === undefined) ? null : val;
  } else if (type === "per90") {
    const base = statistics[statField];
    const additive = metric.additiveField ? statistics[metric.additiveField] : undefined;

    // Both fields null/undefined → null (no data)
    if ((base === null || base === undefined) && (additive === null || additive === undefined)) {
      rawValue = null;
    } else {
      const total = (base ?? 0) + (additive ?? 0);
      rawValue = minutesPlayed > 0 ? (total / minutesPlayed) * 90 : null;
    }
  } else if (type === "rate") {
    const num = statistics[statField];
    const denField = metric.denominatorField;
    const den = denField ? statistics[denField] : undefined;

    if (!den || num === null || num === undefined) {
      rawValue = null;
    } else {
      rawValue = Number(num) / Number(den);
    }
  }

  // Safety: return null for NaN, Infinity, or -Infinity
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
  if (minutesPlayed < RADAR_MINUTE_TIERS.PERCENTILE_ENABLE) {
    tier = "show_only";
  } else if (minutesPlayed < RADAR_MINUTE_TIERS.FULL_CONFIDENCE) {
    tier = "percentile_ready";
  } else {
    tier = "full_confidence";
  }

  const template = getTemplateForRole(role);
  const spokes: RadarSpokeValue[] = template.metrics.map((metric) => {
    const rawValue = computeSpokeRawValue(
      statistics,
      metric,
      minutesPlayed
    );

    return {
      key: metric.key,
      label: metric.label,
      type: metric.type,
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
