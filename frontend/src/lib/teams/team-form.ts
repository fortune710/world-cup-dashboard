import type { LiveRushMatch } from "@/datatypes"
import { logger } from "@/lib/logger"

export interface FormType {
    matchId: string
    result: "W" | "D" | "L"
    opponentId: string
    score: string
    date: string
}

export interface TeamFormTeam {
    code: string
    name: string
}

function normalizeTeamKey(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
}

function buildTeamKeys(team: TeamFormTeam): Set<string> {
    return new Set([
        team.code.trim().toLowerCase(),
        team.name.trim().toLowerCase(),
        normalizeTeamKey(team.code),
        normalizeTeamKey(team.name),
    ])
}

export function teamForm(
    matches: LiveRushMatch[],
    team: TeamFormTeam,
    limit: number = 5
): FormType[] {
    const teamKeys = buildTeamKeys(team)

    logger.info({
        message: "Building team form",
        team_code: team.code,
        team_name: team.name,
        match_count: matches.length,
        limit,
    })

    const form: FormType[] = matches
        .filter((match) => {
            const isFinished = match.status === "finished"
            if (!isFinished) {
                return false
            }

            const homeKey = normalizeTeamKey(match.homeTeam)
            const awayKey = normalizeTeamKey(match.awayTeam)
            return teamKeys.has(homeKey) || teamKeys.has(awayKey)
        })
        .sort((a, b) => {
            const dateA = a.kickoffUtc ? new Date(a.kickoffUtc).getTime() : 0
            const dateB = b.kickoffUtc ? new Date(b.kickoffUtc).getTime() : 0
            return dateB - dateA
        })
        .slice(0, limit)
        .map((match) => {
            const isHome = teamKeys.has(normalizeTeamKey(match.homeTeam))
            const teamScore = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0)
            const oppScore = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0)

            const result: "W" | "D" | "L" =
                teamScore > oppScore ? "W" : teamScore === oppScore ? "D" : "L"

            return {
                matchId: String(match.id),
                result,
                opponentId: String(isHome ? match.awayTeam : match.homeTeam),
                score: `${teamScore}-${oppScore}`,
                date: match.kickoffUtc || "",
            }
        })

    logger.info({
        message: "Built team form",
        team_code: team.code,
        team_name: team.name,
        form_count: form.length,
    })

    return form
}
