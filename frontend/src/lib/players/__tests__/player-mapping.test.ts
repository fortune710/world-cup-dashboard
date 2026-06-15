import { describe, expect, it } from "bun:test";
import {
  positionsToRadarRole,
  positionsToDisplayPosition,
  normalizePlayer,
} from "../player-mapping";

describe("positionsToRadarRole", () => {
  describe("Clean cases", () => {
    it("resolves clean single position codes with appropriate classifications", () => {
      expect(positionsToRadarRole("GK", "G")).toBe("GK");
      expect(positionsToRadarRole("CB", "D")).toBe("CB");
      expect(positionsToRadarRole("LB", "D")).toBe("FB");
      expect(positionsToRadarRole("RB", "D")).toBe("FB");
      expect(positionsToRadarRole("LWB", "D")).toBe("FB");
      expect(positionsToRadarRole("RWB", "D")).toBe("FB");
      expect(positionsToRadarRole("WB", "D")).toBe("FB");
      expect(positionsToRadarRole("DM", "M")).toBe("DM");
      expect(positionsToRadarRole("CM", "M")).toBe("CM");
      expect(positionsToRadarRole("AM", "M")).toBe("AMW");
      expect(positionsToRadarRole("LW", "M")).toBe("AMW");
      expect(positionsToRadarRole("RW", "M")).toBe("AMW");
      expect(positionsToRadarRole("W", "F")).toBe("AMW");
      expect(positionsToRadarRole("SS", "F")).toBe("AMW");
      expect(positionsToRadarRole("ST", "F")).toBe("ST");
      expect(positionsToRadarRole("CF", "F")).toBe("ST");
    });
  });

  describe("Multi-position tie-break cases", () => {
    it("resolves multi-position strings using the first code as primary", () => {
      expect(positionsToRadarRole("LW,ST", "F")).toBe("AMW");
      expect(positionsToRadarRole("ST,LW", "F")).toBe("ST");
      expect(positionsToRadarRole("DM,CM", "M")).toBe("DM");
      expect(positionsToRadarRole("CM,DM", "M")).toBe("CM");
    });
  });

  describe("Ambiguous/edge cases", () => {
    it("falls back to classification defaults on empty positions string", () => {
      expect(positionsToRadarRole("", "F")).toBe("ST");
    });

    it("falls back to classification defaults on null or undefined positions", () => {
      expect(positionsToRadarRole(null, "D")).toBe("CB");
      expect(positionsToRadarRole(undefined, "D")).toBe("CB");
    });

    it("falls back to classification defaults on unknown position code", () => {
      expect(positionsToRadarRole("XX", "M")).toBe("CM");
    });

    it("normalizes case and leading/trailing whitespace", () => {
      expect(positionsToRadarRole("st", "F")).toBe("ST");
      expect(positionsToRadarRole(" ST ", "F")).toBe("ST");
    });
  });
});

describe("positionsToDisplayPosition", () => {
  it("resolves positions via RadarRoles to appropriate DisplayPositions", () => {
    // RadarRole 'GK' -> 'GK'
    expect(positionsToDisplayPosition("GK", "G")).toBe("GK");
    // RadarRole 'CB' -> 'DEF'
    expect(positionsToDisplayPosition("CB", "D")).toBe("DEF");
    // RadarRole 'FB' -> 'DEF'
    expect(positionsToDisplayPosition("LB", "D")).toBe("DEF");
    // RadarRole 'DM' -> 'MID'
    expect(positionsToDisplayPosition("DM", "M")).toBe("MID");
    // RadarRole 'CM' -> 'MID'
    expect(positionsToDisplayPosition("CM", "M")).toBe("MID");
    // RadarRole 'AMW' -> 'FWD'
    expect(positionsToDisplayPosition("AM", "M")).toBe("FWD");
    // RadarRole 'ST' -> 'FWD'
    expect(positionsToDisplayPosition("ST", "F")).toBe("FWD");
  });
});

describe("normalizePlayer", () => {
  it("normalizes player properties correct and returns a new object", () => {
    const inputPlayer = {
      id: "1",
      name: "Test",
      classification: "F" as const,
      positions: "ST",
    };

    const result = normalizePlayer(inputPlayer);

    expect(result.displayPosition).toBe("FWD");
    expect(result.radarRole).toBe("ST");
    expect(result.id).toBe("1");
    expect(result.name).toBe("Test");

    // Reference equality check to ensure original object is not mutated
    expect(result).not.toBe(inputPlayer);
    expect((inputPlayer as any).displayPosition).toBeUndefined();
    expect((inputPlayer as any).radarRole).toBeUndefined();
  });
});
