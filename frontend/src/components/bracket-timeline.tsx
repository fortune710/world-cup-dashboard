import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import type {
  BracketMatchViewModel,
  BracketRoundViewModel,
  BracketTeamViewModel,
} from "@/lib/helpers/bracket.helpers"
import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"

function TimelineTeam({
  team,
  isWinner,
  alignEnd,
}: {
  team: BracketTeamViewModel
  isWinner: boolean
  alignEnd?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5",
        alignEnd && "flex-row-reverse"
      )}
    >
      {team.placeholder ? (
        <span className="flex h-3 w-4 shrink-0 items-center justify-center rounded-[2px] border border-dashed border-foreground/20 text-[7px] text-muted-foreground">
          ?
        </span>
      ) : (
        <img
          src={getTeamFlagUrl(
            { idCountry: team.code, teamName: team.name },
            20
          )}
          alt={team.name}
          className="h-3 w-4 shrink-0 rounded-[2px] border border-black/20 object-cover"
        />
      )}
      <span
        className={cn(
          "truncate text-[11px] tracking-wide uppercase",
          isWinner ? "font-bold text-foreground" : "text-muted-foreground"
        )}
      >
        {team.code}
      </span>
    </div>
  )
}

function TimelineMatch({ match }: { match: BracketMatchViewModel }) {
  const wentToPens = match.homePen != null && match.awayPen != null
  const hasScore = match.isCompleted || match.isLive

  return (
    <li className="flex flex-col gap-0.5 rounded-lg border border-foreground/5 bg-card/80 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <TimelineTeam
          team={match.homeTeam}
          isWinner={match.winnerSide === "home"}
        />
        {hasScore ? (
          <span className="shrink-0 text-xs font-semibold tabular-nums">
            {match.homeScore ?? "–"}–{match.awayScore ?? "–"}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] text-muted-foreground/70 uppercase">
            vs
          </span>
        )}
        <TimelineTeam
          team={match.awayTeam}
          isWinner={match.winnerSide === "away"}
          alignEnd
        />
      </div>
      {match.isLive || wentToPens ? (
        <div className="flex justify-center gap-1">
          {match.isLive ? (
            <Badge
              variant="outline"
              className="h-4 border-none bg-chart-live/10 px-1.5 text-[9px] font-bold tracking-wider text-chart-live uppercase"
            >
              Live
            </Badge>
          ) : null}
          {wentToPens ? (
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[9px] tracking-wider text-muted-foreground uppercase"
            >
              Pens {match.homePen}–{match.awayPen}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export function BracketTimeline({
  rounds,
}: {
  rounds: BracketRoundViewModel[]
}) {
  React.useEffect(() => {
    logger.info({
      message: "Bracket timeline rendered",
      round_count: rounds.length,
      match_count: rounds.reduce(
        (count, round) => count + round.matches.length,
        0
      ),
    })
  }, [rounds])

  if (rounds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No knockout results yet.</p>
    )
  }

  return (
    <ol className="relative flex flex-col gap-5 border-s border-border/70 ps-4">
      {rounds.map((round) => {
        const visibleMatches = round.matches.filter(
          (match) => !(match.homeTeam.placeholder && match.awayTeam.placeholder)
        )

        return (
          <li key={round.key} className="relative">
            <span
              aria-hidden
              className="absolute -start-[21px] top-0.5 size-2.5 rounded-full bg-[#e9b949] ring-2 ring-card"
            />
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {round.label}
            </h3>
            {visibleMatches.length > 0 ? (
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {visibleMatches.map((match) => (
                  <TimelineMatch key={match.id} match={match} />
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Awaiting teams
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
