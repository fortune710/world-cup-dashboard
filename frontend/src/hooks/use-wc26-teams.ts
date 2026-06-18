import * as React from "react"
import { useTranslation } from "react-i18next"
import { API_BASE_URL } from "@/lib/api-config"
import { getFederationByCountryCode } from "@/lib/helpers/federation.helpers"
import { logger } from "@/lib/logger"

import {
  type Wc26TeamRow,
  normalizeTeamKey,
} from "@/lib/teams/wc26-teams"
import { powerRankingRows } from "@/lib/helpers/power-ranking.helpers"

export function useWc26Teams(): {
  teams: Wc26TeamRow[]
  errorMessage: string | null
  isLoading: boolean
  refetch: () => void
} {
  const { t } = useTranslation()
  const [teams, setTeams] = React.useState<Wc26TeamRow[]>([])
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [reloadTrigger, setReloadTrigger] = React.useState(0)

  const refetch = React.useCallback(() => {
    setReloadTrigger((prev) => prev + 1)
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()

    logger.info({
      message: "Fetching WC26 teams",
    })
    setIsLoading(true)
    setErrorMessage(null)

    fetch(`${API_BASE_URL}/teams`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return (await res.json())
      })
      .then((data) => {
        const powerTeamMap = new Map<string, typeof powerRankingRows[number]>()
        for (const row of powerRankingRows) {
          powerTeamMap.set(normalizeTeamKey(row.team), row)
          if (row.code) {
            powerTeamMap.set(row.code.toUpperCase(), row)
          }
        }

        const mapped: Wc26TeamRow[] = data.map((item: any) => {
          const powerRow =
            powerTeamMap.get(item.code.toUpperCase()) ??
            powerTeamMap.get(normalizeTeamKey(item.name)) ??
            null
          const form = powerRow?.form ?? null

          return {
            idCountry: item.code,
            teamName: item.name,
            fifaRank: item.fifa_ranking,
            fifaPoints: item.points,
            confederation: getFederationByCountryCode(item.code),
            rankChange: 0,
            groupStageElo: item.elo_rating ?? 1500,
            form: form,
            group: item.group || "A",
          }
        })

        const sorted = mapped.toSorted((a, b) => {
          const eloA = a.groupStageElo!
          const eloB = b.groupStageElo!
          return eloB - eloA
        })

        const withRanks = sorted.map((team, index) => ({
          ...team,
          eloRank: index + 1,
        }))

        setTeams(withRanks)
        logger.info({
          message: "Fetched WC26 teams",
          count: withRanks.length,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorMessage(
          error instanceof Error ? error.message : t("teamsPage.loadFailed")
        )
        logger.error({
          message: "Failed to fetch WC26 teams",
          error:
            error instanceof Error
              ? { message: error.message, type: error.name }
              : { message: String(error), type: "UnknownError" },
        })
      })
      .finally(() => {
        if (controller.signal.aborted) return
        setIsLoading(false)
        logger.info({
          message: "WC26 teams fetch settled",
        })
      })

    return () => controller.abort()
  }, [t, reloadTrigger])

  return { teams, errorMessage, isLoading, refetch }
}
