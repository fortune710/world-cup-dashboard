import * as React from "react"
import { useTranslation } from "react-i18next"
import { API_BASE_URL } from "@/lib/api-config"

import {
  type Wc26TeamRow,
  normalizeTeamKey,
} from "@/lib/teams/wc26-teams"
import { powerRankingRows } from "@/lib/helpers/power-ranking.helpers"

function getConfederationByCode(code: string): string {
  const codeUpper = code.toUpperCase();
  const uefa = ["FRA", "ENG", "ESP", "POR", "GER", "NED", "BEL", "CRO", "SWE", "NOR", "AUT", "SCO", "CZE", "POL", "DEN", "ITA", "WAL"];
  const conmebol = ["ARG", "BRA", "URU", "COL", "PAR", "CHI", "PER"];
  const concacaf = ["USA", "MEX", "CAN", "PAN", "HON", "JAM", "CRC", "HAI", "CUW"];
  const afc = ["KOR", "JPN", "IRN", "KSA", "IRQ", "JOR", "UZB", "QAT", "AUS"];
  const caf = ["SEN", "MAR", "EGY", "NGA", "CMR", "RSA", "TUN", "ALG", "GHA", "COD", "CPV"];
  
  if (uefa.includes(codeUpper)) return "UEFA";
  if (conmebol.includes(codeUpper)) return "CONMEBOL";
  if (concacaf.includes(codeUpper)) return "CONCACAF";
  if (afc.includes(codeUpper)) return "AFC";
  if (caf.includes(codeUpper)) return "CAF";
  return "OFC";
}

export function useWc26Teams(): {
  teams: Wc26TeamRow[]
  errorMessage: string | null
  isLoading: boolean
} {
  const { t } = useTranslation()
  const [teams, setTeams] = React.useState<Wc26TeamRow[]>([])
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()

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
            confederation: getConfederationByCode(item.code),
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
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorMessage(
          error instanceof Error ? error.message : t("teamsPage.loadFailed")
        )
      })
      .finally(() => {
        if (controller.signal.aborted) return
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [t])

  return { teams, errorMessage, isLoading }
}
