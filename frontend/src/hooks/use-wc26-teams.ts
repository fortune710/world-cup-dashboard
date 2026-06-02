import * as React from "react"
import { useTranslation } from "react-i18next"

import {
  buildWc26TeamRows,
  FIFA_RANKINGS_URL,
  type FifaRankingsResponse,
  type Wc26TeamRow,
} from "@/lib/teams/wc26-teams"

export function useWc26Teams(): {
  teams: Wc26TeamRow[]
  errorMessage: string | null
  isLoading: boolean
} {
  const { t } = useTranslation()
  const [fifaResults, setFifaResults] = React.useState<FifaRankingsResponse["Results"] | null>(
    null
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()

    setIsLoading(true)
    setErrorMessage(null)

    fetch(FIFA_RANKINGS_URL, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return (await res.json()) as FifaRankingsResponse
      })
      .then((data) => {
        setFifaResults(data.Results ?? [])
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

  const teams = React.useMemo(
    () => buildWc26TeamRows(fifaResults ?? []),
    [fifaResults]
  )

  return { teams, errorMessage, isLoading }
}
