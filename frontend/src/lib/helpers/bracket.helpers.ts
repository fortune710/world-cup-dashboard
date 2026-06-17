import { logger } from "@/lib/logger"

export type BracketRoundKey = "R32" | "R16" | "QF" | "SF" | "3rd" | "final"

export const BRACKET_ROUND_ORDER: BracketRoundKey[] = [
  "R32",
  "R16",
  "QF",
  "SF",
  "3rd",
  "final",
]

const BRACKET_ROUND_LABELS: Record<BracketRoundKey, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  "3rd": "3rd place",
  final: "Final",
}

export interface BracketTeamApi {
  name?: string | null
  code?: string | null
}

export interface BracketMatchApi {
  id: number | string
  round: string
  home_team?: BracketTeamApi | null
  away_team?: BracketTeamApi | null
  home_team_code?: string | null
  away_team_code?: string | null
  home_score?: number | null
  away_score?: number | null
  home_pen?: number | null
  away_pen?: number | null
  kickoff_utc?: string | null
  status?: string | null
  phase?: string | null
  group?: string | null
}

export interface BracketRoundApi {
  round: string
  matches: BracketMatchApi[]
}

export interface BracketTeamViewModel {
  code: string
  name: string
  placeholder: boolean
  identityKey: string
}

export type BracketMatchWinnerSide = "home" | "away" | null

export function isBracketMatchCompleted(
  status: string | null | undefined
): boolean {
  const value = String(status ?? "").toLowerCase()

  return (
    value === "ft" ||
    value === "finished" ||
    value === "ended" ||
    value === "completed"
  )
}

export interface BracketMatchViewModel {
  id: string
  round: BracketRoundKey
  homeTeam: BracketTeamViewModel
  awayTeam: BracketTeamViewModel
  homeScore: number | null
  awayScore: number | null
  homePen: number | null
  awayPen: number | null
  winnerSide: BracketMatchWinnerSide
  advancementLabel: string | null
  isCompleted: boolean
}

export interface BracketRoundViewModel {
  key: BracketRoundKey
  label: string
  matches: BracketMatchViewModel[]
}

function normalizeBracketRoundKey(round: string): BracketRoundKey | null {
  const normalized = round.toLowerCase().trim()
  let key: BracketRoundKey | null = null

  if (normalized === "r32" || normalized === "round of 32") {
    key = "R32"
  }

  if (key == null && (normalized === "r16" || normalized === "round of 16")) {
    key = "R16"
  }

  if (key == null && (normalized === "qf" || normalized === "quarter-final")) {
    key = "QF"
  }

  if (key == null && (normalized === "sf" || normalized === "semi-final")) {
    key = "SF"
  }

  if (key == null && (normalized === "3rd" || normalized === "3rd place")) {
    key = "3rd"
  }

  if (key == null && normalized === "final") {
    key = "final"
  }

  logger.info({
    message: "Normalized bracket round key",
    round,
    normalized_round: normalized,
    bracket_round_key: key,
  })

  if (key != null) {
    return key
  }

  return null
}

export function buildBracketApiPath(): string {
  const path = "/bracket"
  logger.info({
    message: "Built bracket API path",
    path,
  })
  return path
}

export function resolveBracketTeamViewModel(
  team: BracketTeamApi | null | undefined,
  fallbackCode?: string | null
): BracketTeamViewModel {
  const rawCode = (team?.code ?? fallbackCode ?? "").trim()
  const rawName = (team?.name ?? "").trim()
  const displayCode = rawCode || "TBD"
  const name = rawName || displayCode
  const identitySource = rawCode || rawName || "TBD"

  logger.info({
    message: "Resolved bracket team view model",
    team_code: rawCode || null,
    team_name: rawName || null,
    display_code: displayCode,
    placeholder: displayCode === "TBD",
  })

  return {
    code: displayCode,
    name,
    placeholder: displayCode === "TBD",
    identityKey: identitySource.toLowerCase(),
  }
}

export function getBracketMatchWinnerSide(
  match: BracketMatchApi
): BracketMatchWinnerSide {
  const status = (match.status ?? "").toLowerCase()
  const homeScore = match.home_score
  const awayScore = match.away_score

  let winner: BracketMatchWinnerSide = null

  if (
    status === "scheduled" ||
    status === "upcoming" ||
    status === "not_started"
  ) {
    winner = null
  } else if (
    homeScore != null &&
    awayScore != null &&
    homeScore !== awayScore
  ) {
    winner = homeScore > awayScore ? "home" : "away"
  } else if (
    homeScore != null &&
    awayScore != null &&
    homeScore === awayScore &&
    match.home_pen != null &&
    match.away_pen != null &&
    match.home_pen !== match.away_pen
  ) {
    winner = match.home_pen > match.away_pen ? "home" : "away"
  }

  logger.info({
    message: "Resolved bracket match winner side",
    match_id: String(match.id),
    status,
    home_score: homeScore,
    away_score: awayScore,
    home_pen: match.home_pen,
    away_pen: match.away_pen,
    winner_side: winner,
  })

  return winner
}

function resolveBracketAdvancementLabel(
  winnerIdentity: string | null,
  currentRoundKey: BracketRoundKey,
  roundsByKey: Map<BracketRoundKey, { key: BracketRoundKey; label: string; matches: BracketMatchApi[] }>
): string | null {
  let label: string | null = null

  if (winnerIdentity && currentRoundKey === "final") {
    label = "Champion"
  } else if (winnerIdentity) {
    const currentIndex = BRACKET_ROUND_ORDER.indexOf(currentRoundKey)
    for (
      let nextIndex = currentIndex + 1;
      nextIndex < BRACKET_ROUND_ORDER.length;
      nextIndex += 1
    ) {
      const nextRoundKey = BRACKET_ROUND_ORDER[nextIndex]
      const nextRound = roundsByKey.get(nextRoundKey)
      if (!nextRound) {
        continue
      }

      const advances = nextRound.matches.some((nextMatch) => {
        const nextHome =
          (nextMatch.home_team?.code ??
            nextMatch.home_team_code ??
            nextMatch.home_team?.name ??
            "TBD"
          )
            .trim()
            .toLowerCase()
        const nextAway =
          (nextMatch.away_team?.code ??
            nextMatch.away_team_code ??
            nextMatch.away_team?.name ??
            "TBD"
          )
            .trim()
            .toLowerCase()

        return nextHome === winnerIdentity || nextAway === winnerIdentity
      })

      if (advances) {
        label = nextRoundKey
        break
      }
    }
  }

  logger.info({
    message: "Resolved bracket advancement label",
    winner_identity: winnerIdentity,
    current_round: currentRoundKey,
    advancement_label: label,
  })

  return label
}

export function buildBracketViewModel(
  rounds: BracketRoundApi[]
): BracketRoundViewModel[] {
  logger.info({
    message: "Building bracket view model",
    round_count: rounds.length,
  })

  const normalizedRounds = rounds
    .map((round) => {
      const key = normalizeBracketRoundKey(round.round)

      if (!key) {
        logger.warn({
          message: "Skipping unexpected bracket round",
          round: round.round,
        })
        return null
      }

      return {
        key,
        label: BRACKET_ROUND_LABELS[key],
        matches: round.matches,
      }
    })
    .filter(
      (
        round
      ): round is {
        key: BracketRoundKey
        label: string
        matches: BracketMatchApi[]
      } => round !== null
    )
    .sort(
      (left, right) =>
        BRACKET_ROUND_ORDER.indexOf(left.key) - BRACKET_ROUND_ORDER.indexOf(right.key)
    )

  const roundsByKey = new Map(
    normalizedRounds.map((round) => [round.key, round])
  )

  const roundViewModels: BracketRoundViewModel[] = normalizedRounds.map(
    (round) => ({
      key: round.key,
      label: round.label,
      matches: round.matches.map((match) => {
        const homeTeam = resolveBracketTeamViewModel(
          match.home_team,
          match.home_team_code
        )
        const awayTeam = resolveBracketTeamViewModel(
          match.away_team,
          match.away_team_code
        )
        const winnerSide = getBracketMatchWinnerSide(match)
        const winnerIdentity =
          winnerSide === "home"
            ? homeTeam.identityKey
            : winnerSide === "away"
              ? awayTeam.identityKey
              : null

        return {
          id: String(match.id),
          round: round.key,
          homeTeam,
          awayTeam,
          homeScore: match.home_score ?? null,
          awayScore: match.away_score ?? null,
          homePen: match.home_pen ?? null,
          awayPen: match.away_pen ?? null,
          winnerSide,
          advancementLabel: resolveBracketAdvancementLabel(
            winnerIdentity,
            round.key,
            roundsByKey
          ),
          isCompleted: isBracketMatchCompleted(match.status),
        }
      }),
    })
  )

  logger.info({
    message: "Built bracket view model",
    round_count: roundViewModels.length,
    match_count: roundViewModels.reduce(
      (count, round) => count + round.matches.length,
      0
    ),
  })

  return roundViewModels
}
