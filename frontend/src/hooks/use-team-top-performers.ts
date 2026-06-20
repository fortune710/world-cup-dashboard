import { useEffect, useMemo } from "react"
import useSWR from "swr"

import { API_BASE_URL } from "@/lib/api-config"
import { logger } from "@/lib/logger"
import { getPlayerAvatarUrl } from "@/lib/players/player-image"

export type TeamTopPerformerEntry = {
  id: number
  name: string
  country_code: string
  image_url?: string | null
  classification?: string | null
  positions?: string | null
  rating?: number
  goals?: number
  assists?: number
  big_chances_created?: number
}

export type TeamTopPerformersData = {
  rating?: TeamTopPerformerEntry | null
  goals?: TeamTopPerformerEntry | null
  assists?: TeamTopPerformerEntry | null
  big_chances_created?: TeamTopPerformerEntry | null
}

const POSITION_MAP: Record<string, string> = {
  F: "FWD",
  M: "MID",
  D: "DEF",
  G: "GK",
}

async function fetchTeamTopPerformers(
  teamCode: string
): Promise<TeamTopPerformersData> {
  const url = `${API_BASE_URL}/teams/${teamCode}/top-performers`
  logger.info("Fetching team top performers", { teamCode, url })
  const response = await fetch(url)

  if (!response.ok) {
    logger.error("Failed to fetch team top performers", {
      teamCode,
      status: response.status,
    })
    throw new Error("Failed to fetch team top performers")
  }

  const data = (await response.json()) as TeamTopPerformersData
  logger.info("Fetched team top performers", { teamCode })
  return data
}

function resolvePosition(entry: TeamTopPerformerEntry | null | undefined): string {
  if (!entry) return "—"
  if (entry.positions?.trim()) {
    return entry.positions.split(",")[0].trim()
  }
  if (entry.classification && POSITION_MAP[entry.classification]) {
    return POSITION_MAP[entry.classification]
  }
  return entry.classification ?? "—"
}

export function useTeamTopPerformers(teamCode: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    teamCode ? `team-top-performers-${teamCode}` : null,
    () => fetchTeamTopPerformers(teamCode!),
    {
      shouldRetryOnError: true,
      errorRetryCount: 3,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    logger.info("Team top performers hook state updated", {
      teamCode,
      loading: isLoading,
      hasError: Boolean(error),
      hasData: data !== undefined,
    })
  }, [teamCode, data, error, isLoading])

  const performers = useMemo(() => {
    if (!data) return []

    const entries = [
      data.rating
        ? {
            name: data.rating.name,
            position: resolvePosition(data.rating),
            country: data.rating.country_code,
            rating: data.rating.rating ?? 0,
            category: "Top Rated" as const,
            avatar: getPlayerAvatarUrl(data.rating.image_url),
            federation: "",
            group: "",
            playerId: data.rating.id,
          }
        : null,
      data.goals
        ? {
            name: data.goals.name,
            position: resolvePosition(data.goals),
            country: data.goals.country_code,
            goals: data.goals.goals ?? 0,
            category: "Top Goalscorer" as const,
            avatar: getPlayerAvatarUrl(data.goals.image_url),
            federation: "",
            group: "",
            playerId: data.goals.id,
          }
        : null,
      data.assists
        ? {
            name: data.assists.name,
            position: resolvePosition(data.assists),
            country: data.assists.country_code,
            assists: data.assists.assists ?? 0,
            category: "Most Assists" as const,
            avatar: getPlayerAvatarUrl(data.assists.image_url),
            federation: "",
            group: "",
            playerId: data.assists.id,
          }
        : null,
      data.big_chances_created
        ? {
            name: data.big_chances_created.name,
            position: resolvePosition(data.big_chances_created),
            country: data.big_chances_created.country_code,
            chancesCreated: data.big_chances_created.big_chances_created ?? 0,
            category: "Most Chances Created" as const,
            avatar: getPlayerAvatarUrl(data.big_chances_created.image_url),
            federation: "",
            group: "",
            playerId: data.big_chances_created.id,
          }
        : null,
    ]

    return entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  }, [data])

  return {
    data,
    performers,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: mutate,
  }
}
