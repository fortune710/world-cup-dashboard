import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams, useSearchParams } from "react-router"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/error-state"
import {
  PlayerCompareAnalysisGrid,
  PlayerCompareSummaries,
} from "@/components/player-compare-radar"
import { PlayerCompareDialog } from "@/components/player-compare-dialog"
import { usePlayerDetails } from "@/hooks/use-player-details"

export function PlayerComparePage() {
  const { t } = useTranslation()
  const { playerId } = useParams<{ playerId: string }>()
  const [searchParams] = useSearchParams()
  const compareId = searchParams.get("compareId")
  const [compareOpen, setCompareOpen] = React.useState(false)

  const { player, loading, error, refetch } = usePlayerDetails(playerId)
  const {
    player: comparePlayer,
    loading: compareLoading,
    error: compareError,
    refetch: refetchCompare,
  } = usePlayerDetails(compareId ?? undefined)

  const isLoading = loading || compareLoading
  const hasCompareTarget = Boolean(compareId)

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        {t("playerCompare.loading", { defaultValue: "Loading comparison..." })}
      </div>
    )
  }

  if (!hasCompareTarget) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={playerId ? `/players/${playerId}` : "/players"}>
            <ArrowLeftIcon data-icon="inline-start" />
            {t("playerCompare.backToPlayer", { defaultValue: "Back to player" })}
          </Link>
        </Button>
        <ErrorState
          message={t("playerCompare.missingCompareId", {
            defaultValue: "Choose a player to compare from the player details page.",
          })}
        />
      </div>
    )
  }

  if (error || compareError || !player || !comparePlayer) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={playerId ? `/players/${playerId}` : "/players"}>
            <ArrowLeftIcon data-icon="inline-start" />
            {t("playerCompare.backToPlayer", { defaultValue: "Back to player" })}
          </Link>
        </Button>
        <ErrorState
          message={
            error || compareError
              ? t("playerCompare.loadError", { defaultValue: "Failed to load player comparison." })
              : t("playerCompare.notFound", { defaultValue: "One or both players could not be found." })
          }
          onRetry={
            error || compareError
              ? () => {
                  void refetch()
                  void refetchCompare()
                }
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to={`/players/${player.id}`}>
          <ArrowLeftIcon data-icon="inline-start" />
          {t("playerCompare.backToPlayer", { defaultValue: "Back to player" })}
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("playerCompare.pageTitle", { defaultValue: "Player comparison" })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("playerCompare.pageDescription", {
            defaultValue: "{{primary}} vs {{compare}}",
            primary: player.name,
            compare: comparePlayer.name,
          })}
        </p>
      </div>

      <PlayerCompareSummaries
        primaryPlayer={player}
        comparePlayer={comparePlayer}
        onSwitchComparePlayer={() => setCompareOpen(true)}
      />

      <PlayerCompareAnalysisGrid primaryPlayer={player} comparePlayer={comparePlayer} />

      <PlayerCompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        currentPlayerId={player.id}
        excludePlayerIds={[comparePlayer.id]}
      />
    </div>
  )
}
