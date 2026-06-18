import * as React from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, GitBranch, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import {
  BRACKET_ROUND_ORDER,
  type BracketMatchViewModel,
  type BracketRoundViewModel,
} from "@/lib/helpers/bracket.helpers"
import { useBracket } from "@/hooks/use-bracket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"

function BracketMatchCard({ match }: { match: BracketMatchViewModel }) {
  useTranslation()

  React.useEffect(() => {
    logger.info({
      message: "Bracket match card rendered",
      match_id: match.id,
      round: match.round,
      winner_side: match.winnerSide,
      advancement_label: match.advancementLabel,
      is_completed: match.isCompleted,
    })
  }, [match.id, match.round, match.winnerSide, match.advancementLabel, match.isCompleted])

  const renderTeam = (
    side: "home" | "away",
    team: BracketMatchViewModel["homeTeam"],
    score: number | null,
    pen: number | null
  ) => {
    const isWinner = match.winnerSide === side

    logger.info({
      message: "Rendered bracket team",
      match_id: match.id,
      round: match.round,
      side,
      team_code: team.code,
      placeholder: team.placeholder,
      score,
      penalty: pen,
      winner_side: match.winnerSide,
      is_completed: match.isCompleted,
    })

    return (
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 transition-colors",
          isWinner ? "bg-primary/10" : "bg-transparent"
        )}
      >
        {team.placeholder ? (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-foreground/20 bg-muted/30 text-[8px] font-semibold text-muted-foreground">
            ?
          </div>
        ) : (
          <Avatar className="size-5 shrink-0 rounded-full border border-border/50">
            <AvatarImage
              src={getTeamFlagUrl({ idCountry: team.code, teamName: team.name }, 20)}
              alt={team.code}
              className="object-cover"
            />
            <AvatarFallback className="text-[8px]">{team.code.slice(0, 3)}</AvatarFallback>
          </Avatar>
        )}
        <span
          className={cn(
            "truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
            isWinner && "text-primary"
          )}
        >
          {team.code}
        </span>
        {match.isCompleted ? (
          <div className="flex flex-col items-center leading-none">
            <span className="tabular-nums text-xs font-semibold">{score ?? "—"}</span>
            {pen != null && match.homeScore === match.awayScore ? (
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
                P{pen}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <Card
      size="sm"
      className={cn(
        "border-foreground/10 bg-card/90 shadow-sm",
        match.winnerSide && "border-primary/20 bg-primary/5"
      )}
    >
      <CardContent className="flex flex-col gap-1 px-1.5 py-1.5">
        <div className="flex items-start justify-center gap-1">
          {renderTeam("home", match.homeTeam, match.homeScore, match.homePen)}
          <span className="shrink-0 pt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
            vs
          </span>
          {renderTeam("away", match.awayTeam, match.awayScore, match.awayPen)}
        </div>
        {match.advancementLabel ? (
          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
            {match.advancementLabel === "Champion" ? (
              <Trophy className="size-2.5" />
            ) : (
              <ArrowRight className="size-2.5" />
            )}
            <span>{match.advancementLabel}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function BracketPage() {
  const { t } = useTranslation()
  const { rounds, loading, error, hasData } = useBracket()

  React.useEffect(() => {
    logger.info({
      message: "Bracket page state updated",
      loading,
      has_error: Boolean(error),
      has_data: hasData,
      round_count: rounds.length,
    })
  }, [loading, error, hasData, rounds.length])

  const renderMode: "loading" | "error" | "content" =
    loading ? "loading" : error && !hasData ? "error" : "content"

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("routes.bracket")}</h1>
        <p className="max-w-5xl text-sm text-muted-foreground">
          {t("pages.bracket.description")}
        </p>
      </div>

      <div className="rounded-3xl border border-foreground/10 bg-card/70">
        {renderMode === "loading" ? (
          <div className="overflow-x-auto p-4">
            <div className="grid min-w-[54rem] grid-flow-col auto-cols-[8rem] gap-3">
              {BRACKET_ROUND_ORDER.map((roundKey) => (
                <div key={roundKey} className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-muted/20 p-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : renderMode === "error" ? (
          <div className="p-6 text-sm text-destructive">
            {error ?? "Unable to load bracket data."}
          </div>
        ) : rounds.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No knockout matches available yet.
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <div className="grid min-w-[54rem] grid-flow-col auto-cols-[8rem] gap-3">
              {rounds.map((round: BracketRoundViewModel) => (
                <section
                  key={round.key}
                  className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-muted/20 p-2"
                >
                  <div className="flex items-center justify-between gap-1 rounded-lg border border-foreground/10 bg-card/90 px-2 py-1">
                    <div className="flex min-w-0 items-center gap-1">
                      <GitBranch className="size-3 shrink-0 text-muted-foreground" />
                      <span className="truncate text-[10px] font-semibold leading-tight">
                        {round.label}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-4 shrink-0 px-1 text-[8px] uppercase tracking-wider"
                    >
                      {round.matches.length}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {round.matches.map((match) => (
                      <BracketMatchCard key={match.id} match={match} />
                    ))}
                    {round.matches.length === 0 ? (
                      <div className="flex min-h-12 items-center justify-center rounded-lg border border-dashed border-foreground/10 bg-card/70 text-[9px] uppercase tracking-wider text-muted-foreground">
                        TBD
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
