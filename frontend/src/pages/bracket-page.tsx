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
    })
  }, [match.id, match.round, match.winnerSide, match.advancementLabel])

  const renderTeamRow = (
    side: "home" | "away",
    team: BracketMatchViewModel["homeTeam"],
    score: number | null,
    pen: number | null
  ) => {
    const isWinner = match.winnerSide === side

    logger.info({
      message: "Rendered bracket team row",
      match_id: match.id,
      round: match.round,
      side,
      team_code: team.code,
      team_name: team.name,
      placeholder: team.placeholder,
      score,
      penalty: pen,
      winner_side: match.winnerSide,
    })

    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors",
          isWinner ? "bg-primary/10 text-foreground" : "bg-transparent"
        )}
      >
        {team.placeholder ? (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-foreground/20 bg-muted/30 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
            TBD
          </div>
        ) : (
          <Avatar className="size-8 shrink-0 rounded-full border border-border/50">
            <AvatarImage
              src={getTeamFlagUrl({ idCountry: team.code, teamName: team.name }, 40)}
              alt={team.name}
              className="object-cover"
            />
            <AvatarFallback>{team.code.slice(0, 3)}</AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                isWinner && "text-primary"
              )}
            >
              {team.code}
            </span>
            {isWinner ? (
              <Badge
                variant="outline"
                className="h-5 border-primary/25 bg-primary/10 px-1.5 text-[10px] uppercase tracking-[0.18em] text-primary"
              >
                Advancing
              </Badge>
            ) : null}
          </div>
          <div className="truncate text-sm font-medium">{team.name}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="tabular-nums text-lg font-semibold">{score ?? "—"}</span>
          {pen != null && match.homeScore === match.awayScore ? (
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              P {pen}
            </span>
          ) : null}
        </div>
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
      <CardContent className="flex flex-col gap-2 px-3 py-3">
        {renderTeamRow("home", match.homeTeam, match.homeScore, match.homePen)}
        {renderTeamRow("away", match.awayTeam, match.awayScore, match.awayPen)}
        {match.advancementLabel ? (
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            {match.advancementLabel === "Champion" ? (
              <Trophy className="size-3.5" />
            ) : (
              <ArrowRight className="size-3.5" />
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
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("pages.bracket.description")}
        </p>
      </div>

      <div className="rounded-3xl border border-foreground/10 bg-card/70">
        {renderMode === "loading" ? (
          <div className="overflow-x-auto p-4">
            <div className="grid min-w-[114rem] grid-flow-col auto-cols-[18rem] gap-4">
              {BRACKET_ROUND_ORDER.map((roundKey) => (
                <div key={roundKey} className="flex flex-col gap-3 rounded-3xl border border-foreground/10 bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
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
            <div className="grid min-w-[114rem] grid-flow-col auto-cols-[18rem] gap-4">
              {rounds.map((round: BracketRoundViewModel) => (
                <section
                  key={round.key}
                  className="flex flex-col gap-3 rounded-3xl border border-foreground/10 bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-card/90 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="size-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{round.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
                      {round.matches.length}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-3">
                    {round.matches.map((match) => (
                      <BracketMatchCard key={match.id} match={match} />
                    ))}
                    {round.matches.length === 0 ? (
                      <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-foreground/10 bg-card/70 text-xs uppercase tracking-[0.22em] text-muted-foreground">
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
