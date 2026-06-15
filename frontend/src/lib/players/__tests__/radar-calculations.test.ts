import { describe, expect, it } from "bun:test";
import { computeRadarData } from "../radar-calculations";
import { applyPercentiles } from "../radar-percentiles";
import type { PlayerStatistics } from "@/types/player-statistics";

describe("computeRadarData", () => {
  describe("Edge cases (null safety)", () => {
    it("returns insufficient tier and empty spokes when minutes_played is null, 0, or below 90", () => {
      const statsNull: PlayerStatistics = { minutes_played: null };
      const resNull = computeRadarData(statsNull, "ST");
      expect(resNull.tier).toBe("insufficient");
      expect(resNull.spokes).toHaveLength(0);

      const statsZero: PlayerStatistics = { minutes_played: 0 };
      const resZero = computeRadarData(statsZero, "ST");
      expect(resZero.tier).toBe("insufficient");
      expect(resZero.spokes).toHaveLength(0);

      const statsUnder: PlayerStatistics = { minutes_played: 89 };
      const resUnder = computeRadarData(statsUnder, "ST");
      expect(resUnder.tier).toBe("insufficient");
      expect(resUnder.spokes).toHaveLength(0);
    });

    it("returns correct tiers for minutes played thresholds", () => {
      const statsShowOnly: PlayerStatistics = { minutes_played: 90 };
      const resShowOnly = computeRadarData(statsShowOnly, "ST");
      expect(resShowOnly.tier).toBe("show_only");
      expect(resShowOnly.spokes.length).toBeGreaterThan(0);

      const statsPercentileReady: PlayerStatistics = { minutes_played: 270 };
      const resPercentileReady = computeRadarData(statsPercentileReady, "ST");
      expect(resPercentileReady.tier).toBe("percentile_ready");

      const statsFull: PlayerStatistics = { minutes_played: 450 };
      const resFull = computeRadarData(statsFull, "ST");
      expect(resFull.tier).toBe("full_confidence");
    });
  });

  describe("Per-90 formula correctness", () => {
    it("computes per-90 metrics accurately", () => {
      const statsSt: PlayerStatistics = { minutes_played: 270, goals: 3 };
      const resSt = computeRadarData(statsSt, "ST");
      const goalsSpoke = resSt.spokes.find((s) => s.key === "goals_p90");
      expect(goalsSpoke).toBeDefined();
      expect(goalsSpoke!.rawValue).toBeCloseTo(1.0, 5);

      const statsGk: PlayerStatistics = { minutes_played: 180, saves: 6 };
      const resGk = computeRadarData(statsGk, "GK");
      const savesSpoke = resGk.spokes.find((s) => s.key === "saves_p90");
      expect(savesSpoke).toBeDefined();
      expect(savesSpoke!.rawValue).toBeCloseTo(3.0, 5);
    });

    it("returns null for null or undefined stat fields", () => {
      const stats: PlayerStatistics = { minutes_played: 180, goals: null };
      const res = computeRadarData(stats, "ST");
      const goalsSpoke = res.spokes.find((s) => s.key === "goals_p90");
      expect(goalsSpoke).toBeDefined();
      expect(goalsSpoke!.rawValue).toBeNull();
    });
  });

  describe("Percentage passthrough", () => {
    it("passes percentage metrics directly without per-90 division", () => {
      const stats: PlayerStatistics = { minutes_played: 270, accurate_passes_percentage: 87 };
      const res = computeRadarData(stats, "CB");
      const passAccSpoke = res.spokes.find((s) => s.key === "pass_acc");
      expect(passAccSpoke).toBeDefined();
      expect(passAccSpoke!.rawValue).toBe(87);
    });
  });

  describe("Special rate computations", () => {
    it("computes shot accuracy properly", () => {
      const stats: PlayerStatistics = { minutes_played: 180, shots_on_target: 4, total_shots: 10 };
      const res = computeRadarData(stats, "ST");
      const shotAccSpoke = res.spokes.find((s) => s.key === "shot_acc");
      expect(shotAccSpoke).toBeDefined();
      expect(shotAccSpoke!.rawValue).toBeCloseTo(0.4, 5);
    });

    it("returns null for shot accuracy when total shots is 0 or null", () => {
      const statsZero: PlayerStatistics = { minutes_played: 180, shots_on_target: 4, total_shots: 0 };
      const resZero = computeRadarData(statsZero, "ST");
      expect(resZero.spokes.find((s) => s.key === "shot_acc")!.rawValue).toBeNull();

      const statsNull: PlayerStatistics = { minutes_played: 180, shots_on_target: 4, total_shots: null };
      const resNull = computeRadarData(statsNull, "ST");
      expect(resNull.spokes.find((s) => s.key === "shot_acc")!.rawValue).toBeNull();
    });

    it("computes penalty save rate properly", () => {
      const stats: PlayerStatistics = { minutes_played: 180, penalty_save: 1, penalty_faced: 3 };
      const res = computeRadarData(stats, "GK");
      const penSaveSpoke = res.spokes.find((s) => s.key === "penalty_save_r");
      expect(penSaveSpoke).toBeDefined();
      expect(penSaveSpoke!.rawValue).toBeCloseTo(0.3333333333333333, 5);
    });

    it("returns null for penalty save rate when penalty faced is null", () => {
      const stats: PlayerStatistics = { minutes_played: 180, penalty_save: 1, penalty_faced: null };
      const res = computeRadarData(stats, "GK");
      expect(res.spokes.find((s) => s.key === "penalty_save_r")!.rawValue).toBeNull();
    });

    it("computes tackles + interceptions per-90 properly", () => {
      const statsBoth: PlayerStatistics = { minutes_played: 90, tackles: 2, interceptions: 1 };
      const resBoth = computeRadarData(statsBoth, "CB");
      const tackIntSpoke = resBoth.spokes.find((s) => s.key === "tack_int_p90");
      expect(tackIntSpoke).toBeDefined();
      expect(tackIntSpoke!.rawValue).toBeCloseTo(3.0, 5);

      const statsOneNull: PlayerStatistics = { minutes_played: 90, tackles: 2, interceptions: null };
      const resOneNull = computeRadarData(statsOneNull, "CB");
      expect(resOneNull.spokes.find((s) => s.key === "tack_int_p90")!.rawValue).toBeCloseTo(2.0, 5);
    });
  });
});

describe("applyPercentiles", () => {
  const getBaseStats = (goals: number, shots: number, target: number, missed: number, rating: number, minutes = 270): PlayerStatistics => ({
    minutes_played: minutes,
    goals,
    total_shots: shots,
    shots_on_target: target,
    big_chances_missed: missed,
    expected_goals: goals * 0.1,
    aerial_duels_won: 2,
    rating,
  });

  const getTargetStats = () => getBaseStats(2, 6, 3, 1, 7.5);

  const getQualifyingPeers = (count: number): Array<{ id: string; statistics: PlayerStatistics }> => {
    const peers = [];
    for (let i = 0; i < count; i++) {
      const goals = i % 5;
      peers.push({
        id: `peer-${i}`,
        statistics: getBaseStats(goals, 10, 5, i % 3, 6.0 + (i % 2)),
      });
    }
    return peers;
  };

  it("excludes peers with minutes_played < 270", () => {
    const target = getTargetStats();
    const radarData = computeRadarData(target, "ST");
    
    const peers = getQualifyingPeers(14);
    peers.push({
      id: "underplayer",
      statistics: getBaseStats(4, 10, 5, 0, 8.0, 269),
    });

    const res = applyPercentiles(radarData, peers, "ST", "target-id");
    expect(res.peerCountBelowThreshold).toBe(true);
    expect(res.peerCount).toBe(14);
    expect(res.spokes[0].percentile).toBeNull();
  });

  it("excludes peers with statistics: null", () => {
    const target = getTargetStats();
    const radarData = computeRadarData(target, "ST");
    
    const peers: any[] = getQualifyingPeers(14);
    peers.push({
      id: "null-stats",
      statistics: null,
    });

    const res = applyPercentiles(radarData, peers, "ST", "target-id");
    expect(res.peerCountBelowThreshold).toBe(true);
    expect(res.peerCount).toBe(14);
  });

  it("returns null percentiles and peerCountBelowThreshold true when qualifying peers < 15", () => {
    const target = getTargetStats();
    const radarData = computeRadarData(target, "ST");
    const peers = getQualifyingPeers(10);

    const res = applyPercentiles(radarData, peers, "ST", "target-id");
    expect(res.peerCountBelowThreshold).toBe(true);
    expect(res.peerCount).toBe(10);
    res.spokes.forEach((spoke) => {
      expect(spoke.percentile).toBeNull();
    });
  });

  it("computes percentiles between 0 and 100 when qualifying peers >= 15", () => {
    const target = getTargetStats();
    const radarData = computeRadarData(target, "ST");
    const peers = getQualifyingPeers(15); 

    const res = applyPercentiles(radarData, peers, "ST", "target-id");
    expect(res.peerCountBelowThreshold).toBe(false);
    expect(res.peerCount).toBe(15);

    const goalsSpoke = res.spokes.find((s) => s.key === "goals_p90");
    expect(goalsSpoke).toBeDefined();
    expect(goalsSpoke!.percentile).toBe(40);
  });

  it("inverts the percentile score for higherIsBetter: false metrics (e.g. big_chances_missed)", () => {
    const target = getBaseStats(2, 6, 3, 2, 7.5);
    const radarData = computeRadarData(target, "ST");
    const peers = getQualifyingPeers(15);

    const res = applyPercentiles(radarData, peers, "ST", "target-id");
    const missedSpoke = res.spokes.find((s) => s.key === "big_ch_missed_p90");
    expect(missedSpoke).toBeDefined();
    expect(missedSpoke!.percentile).toBe(33);
  });

  it("returns null percentile for a spoke if all qualifying peers have null stats for that metric", () => {
    const target = getTargetStats();
    const radarData = computeRadarData(target, "ST");
    const peers = getQualifyingPeers(15).map((p) => ({
      ...p,
      statistics: {
        ...p.statistics,
        goals: null,
      },
    }));

    const res = applyPercentiles(radarData, peers, "ST", "target-id");
    const goalsSpoke = res.spokes.find((s) => s.key === "goals_p90");
    expect(goalsSpoke).toBeDefined();
    expect(goalsSpoke!.percentile).toBeNull();
  });

  it("excludes the target player from the peer set that ranks them", () => {
    const target = getTargetStats();
    const radarData = computeRadarData(target, "ST");
    const peers = getQualifyingPeers(15);
    peers.push({
      id: "target-id",
      statistics: target,
    });

    const res = applyPercentiles(radarData, peers, "ST", "target-id");
    expect(res.peerCount).toBe(15);
  });
});
