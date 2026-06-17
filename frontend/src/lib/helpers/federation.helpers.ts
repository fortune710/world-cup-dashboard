import { logger } from "@/lib/logger"

export type Federation =
  | "UEFA"
  | "CONMEBOL"
  | "CONCACAF"
  | "AFC"
  | "CAF"
  | "OFC"

const COUNTRY_CODE_TO_FEDERATION: Record<string, Federation> = {
  FRA: "UEFA",
  ENG: "UEFA",
  ESP: "UEFA",
  POR: "UEFA",
  GER: "UEFA",
  NED: "UEFA",
  BEL: "UEFA",
  CRO: "UEFA",
  SWE: "UEFA",
  NOR: "UEFA",
  AUT: "UEFA",
  SCO: "UEFA",
  CZE: "UEFA",
  POL: "UEFA",
  DEN: "UEFA",
  ITA: "UEFA",
  WAL: "UEFA",
  SUI: "UEFA",
  BIH: "UEFA",
  TUR: "UEFA",
  SRB: "UEFA",
  ARG: "CONMEBOL",
  BRA: "CONMEBOL",
  URU: "CONMEBOL",
  COL: "CONMEBOL",
  PAR: "CONMEBOL",
  CHI: "CONMEBOL",
  PER: "CONMEBOL",
  ECU: "CONMEBOL",
  USA: "CONCACAF",
  MEX: "CONCACAF",
  CAN: "CONCACAF",
  PAN: "CONCACAF",
  HON: "CONCACAF",
  JAM: "CONCACAF",
  CRC: "CONCACAF",
  HAI: "CONCACAF",
  CUW: "CONCACAF",
  KOR: "AFC",
  JPN: "AFC",
  IRN: "AFC",
  KSA: "AFC",
  IRQ: "AFC",
  JOR: "AFC",
  UZB: "AFC",
  QAT: "AFC",
  AUS: "AFC",
  SEN: "CAF",
  MAR: "CAF",
  EGY: "CAF",
  NGA: "CAF",
  CMR: "CAF",
  RSA: "CAF",
  TUN: "CAF",
  ALG: "CAF",
  GHA: "CAF",
  COD: "CAF",
  CIV: "CAF",
  CPV: "CAF",
  NZL: "OFC",
}

export function getFederationByCountryCode(
  countryCode: string | null | undefined
): Federation | null {
  logger.info({
    message: "Resolving federation by country code",
    country_code: countryCode ?? null,
  })

  const normalizedCountryCode = countryCode?.trim().toUpperCase()
  if (!normalizedCountryCode) {
    logger.warn({
      message: "Missing country code while resolving federation",
      country_code: countryCode ?? null,
    })
    return null
  }

  const federation = COUNTRY_CODE_TO_FEDERATION[normalizedCountryCode] ?? null

  if (!federation) {
    logger.warn({
      message: "Unknown country code while resolving federation",
      country_code: normalizedCountryCode,
    })
    return null
  }

  logger.info({
    message: "Resolved federation by country code",
    country_code: normalizedCountryCode,
    federation,
  })

  return federation
}
