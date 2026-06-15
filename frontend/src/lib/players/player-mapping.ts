export type Classification = "G" | "D" | "M" | "F";

export type DisplayPosition = "GK" | "DEF" | "MID" | "FWD";

export type RadarRole = "GK" | "CB" | "FB" | "DM" | "CM" | "AMW" | "ST";

const POSITION_CODE_TO_RADAR_ROLE: Record<string, RadarRole> = {
  GK: "GK",
  CB: "CB",
  LB: "FB",
  RB: "FB",
  LWB: "FB",
  RWB: "FB",
  WB: "FB",
  DM: "DM",
  CM: "CM",
  AM: "AMW",
  LW: "AMW",
  RW: "AMW",
  W: "AMW",
  SS: "AMW",
  ST: "ST",
  CF: "ST",
  FW: "ST",
  F: "ST",
};

const CLASSIFICATION_TO_RADAR_ROLE: Record<Classification, RadarRole> = {
  G: "GK",
  D: "CB",
  M: "CM",
  F: "ST",
};

const CLASSIFICATION_TO_DISPLAY_POSITION: Record<Classification, DisplayPosition> = {
  G: "GK",
  D: "DEF",
  M: "MID",
  F: "FWD",
};

export function classificationToRadarRole(classification: Classification): RadarRole {
  return CLASSIFICATION_TO_RADAR_ROLE[classification] || "ST";
}

export function positionsToRadarRole(
  positions: string | null | undefined,
  classification: Classification
): RadarRole {
  if (!positions || typeof positions !== "string" || positions.trim() === "") {
    return classificationToRadarRole(classification);
  }
  const firstPosition = positions.split(",")[0].trim().toUpperCase();
  const role = POSITION_CODE_TO_RADAR_ROLE[firstPosition];
  if (role) {
    return role;
  }
  return classificationToRadarRole(classification);
}

export function positionsToDisplayPosition(
  positions: string | null | undefined,
  classification: Classification
): DisplayPosition {
  const role = positionsToRadarRole(positions, classification);
  switch (role) {
    case "GK":
      return "GK";
    case "CB":
    case "FB":
      return "DEF";
    case "DM":
    case "CM":
      return "MID";
    case "AMW":
    case "ST":
      return "FWD";
    default:
      return CLASSIFICATION_TO_DISPLAY_POSITION[classification] || "FWD";
  }
}

export function normalizePlayer<
  T extends { classification: Classification; positions: string | null | undefined }
>(player: T): T & { displayPosition: DisplayPosition; radarRole: RadarRole } {
  const radarRole = positionsToRadarRole(player.positions, player.classification);
  const displayPosition = positionsToDisplayPosition(player.positions, player.classification);
  return {
    ...player,
    displayPosition,
    radarRole,
  };
}
