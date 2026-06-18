import type { RadarRole } from "./player-mapping";
import type { PlayerStatistics } from "@/types/player-statistics";
import { type RadarData, type RadarSpokeValue, computeSpokeRawValue } from "./radar-calculations";
import { getTemplateForRole, RADAR_MINUTE_TIERS } from "./radar-metrics";

export interface PercentileResult {
  spokes: RadarSpokeValue[];       // same as RadarData.spokes but with percentile filled in
  peerCount: number;               // number of qualifying peers used
  peerCountBelowThreshold: boolean;
}

export function applyPercentiles(
  radarData: RadarData,
  peers: Array<{ id?: number | string; statistics: PlayerStatistics }>,
  role: RadarRole,
  targetPlayerId?: number | string,
  targetStats?: PlayerStatistics
): PercentileResult {
  // 1. Filter peers by minute threshold (>= PERCENTILE_ENABLE), statistics not null, and not target player
  const qualifyingPeers = peers.filter((peer) => {
    if (!peer.statistics) return false;
    
    const minutesPlayed = peer.statistics.minutes_played;
    if (minutesPlayed === null || minutesPlayed === undefined || minutesPlayed < RADAR_MINUTE_TIERS.PERCENTILE_ENABLE) {
      return false;
    }

    if (targetPlayerId !== undefined && peer.id !== undefined && String(peer.id) === String(targetPlayerId)) {
      return false;
    }

    if (targetStats !== undefined && peer.statistics === targetStats) {
      return false;
    }

    return true;
  });

  const peerCount = qualifyingPeers.length;

  // 2. Check qualifying count - if < 5, do NOT compute percentile - return null
  const PEER_THRESHOLD = 5;
  if (peerCount < PEER_THRESHOLD) {
    const spokes = radarData.spokes.map((spoke) => ({
      ...spoke,
      percentile: null,
    }));
    return {
      spokes,
      peerCount,
      peerCountBelowThreshold: true,
    };
  }

  const template = getTemplateForRole(role);

  // 3. For each spoke:
  const spokes = radarData.spokes.map((spoke) => {
    const metric = template.metrics.find((m) => m.key === spoke.key);
    if (!metric) {
      return {
        ...spoke,
        percentile: null,
      };
    }

    // Compute each peer's rawValue for that spoke and filter out nulls
    const peerValues = qualifyingPeers
      .map((peer) => {
        const peerMinutes = peer.statistics.minutes_played ?? 0;
        return computeSpokeRawValue(
          peer.statistics,
          metric,
          peerMinutes
        );
      })
      .filter((val): val is number => val !== null);

    let percentile: number | null = null;
    let averageValue: number | null = null;

    if (peerValues.length > 0) {
      const sum = peerValues.reduce((a, b) => a + b, 0);
      averageValue = sum / peerValues.length;
    }

    if (spoke.rawValue !== null && peerValues.length > 0) {
      const count = peerValues.filter((val) => val < spoke.rawValue!).length;
      const N = peerValues.length;
      let computed = (count / N) * 100;
      if (!spoke.higherIsBetter) {
        computed = 100 - computed;
      }
      percentile = Math.round(computed);
    }

    return {
      ...spoke,
      percentile,
      averageValue,
    };
  });

  return {
    spokes,
    peerCount,
    peerCountBelowThreshold: false,
  };
}
