/**
 * A representative primary color per WC26 team, keyed by FIFA country code.
 * Used to tint each team's road through the bracket maze. Colors are chosen
 * for recognisability on both light and dark surfaces, so pure white/black
 * kits get a saturated stand-in.
 */
const TEAM_COLORS: Record<string, string> = {
  // Group A
  MEX: "#0a6b46",
  KOR: "#cd2e3a",
  RSA: "#007749",
  CZE: "#d7141a",
  // Group B
  CAN: "#d80621",
  SUI: "#d52b1e",
  QAT: "#8a1538",
  BIH: "#002f6c",
  // Group C
  BRA: "#f5d013",
  MAR: "#c1272d",
  SCO: "#005eb8",
  HAI: "#00209f",
  // Group D
  USA: "#2a3f8f",
  AUS: "#00843d",
  PAR: "#0038a8",
  TUR: "#e30a17",
  // Group E
  GER: "#1a1a1a",
  ECU: "#ffd100",
  CIV: "#f77f00",
  CUW: "#002b7f",
  // Group F
  NED: "#f36c21",
  JPN: "#bc002d",
  TUN: "#e70013",
  SWE: "#0a63a8",
  // Group G
  BEL: "#f3d02f",
  IRN: "#239f40",
  EGY: "#ce1126",
  NZL: "#1f2937",
  // Group H
  ESP: "#c60b1e",
  URU: "#4aa0e0",
  KSA: "#165d31",
  CPV: "#003893",
  // Group I
  FRA: "#20409a",
  SEN: "#0a7d4a",
  NOR: "#ba0c2f",
  IRQ: "#007a3d",
  // Group J
  ARG: "#74a9dd",
  AUT: "#ed2939",
  ALG: "#006233",
  JOR: "#ce1126",
  // Group K
  POR: "#d81e05",
  COL: "#fcd116",
  UZB: "#0099b5",
  COD: "#0085ca",
  // Group L
  ENG: "#e11b2b",
  CRO: "#d10000",
  PAN: "#d21034",
  GHA: "#0b6b3f",
  // Mock standings extras
  POL: "#dc143c",
  DNK: "#c8102e",
  CRC: "#002b7f",
  SRB: "#c6363c",
  CMR: "#007a5e",
  ITA: "#0d5eaf",
  CHI: "#d52b1e",
  NGA: "#0a8f52",
  PER: "#d91023",
  HON: "#0073cf",
  JAM: "#009b3a",
  WAL: "#d30731",
}

export function getTeamColor(code: string | null | undefined): string | null {
  if (!code) return null
  return TEAM_COLORS[code.toUpperCase().trim()] ?? null
}
