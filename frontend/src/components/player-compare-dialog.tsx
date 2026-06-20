import * as React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { SearchIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { useDebounce } from "@/hooks/use-debounce"
import { usePlayerSearch } from "@/hooks/use-player-search"
import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"
import { cn } from "@/lib/utils"

interface PlayerCompareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlayerId: number
  excludePlayerIds?: number[]
}

export function PlayerCompareDialog({
  open,
  onOpenChange,
  currentPlayerId,
  excludePlayerIds = [],
}: PlayerCompareDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 300)

  React.useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  const { results, isLoading } = usePlayerSearch({
    query: debouncedSearch,
    limit: 5,
    enabled: debouncedSearch.trim().length > 0,
  })

  const filteredResults = React.useMemo(() => {
    const excluded = new Set([currentPlayerId, ...excludePlayerIds])
    return results.filter((player) => !excluded.has(player.id)).slice(0, 5)
  }, [results, currentPlayerId, excludePlayerIds])

  const handleSelect = (compareId: number) => {
    onOpenChange(false)
    navigate(`/players/${currentPlayerId}/compare?compareId=${compareId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-112">
        <DialogHeader className="border-b border-border/60 px-4 py-4 text-start">
          <DialogTitle>
            {t("playerCompare.searchTitle", { defaultValue: "Compare with another player" })}
          </DialogTitle>
          <DialogDescription>
            {t("playerCompare.searchDescription", {
              defaultValue: "Search by name to pick a player for side-by-side comparison.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("playerCompare.searchPlaceholder", { defaultValue: "Search players..." })}
              className="ps-9"
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-48 border-t border-border/60 px-2 py-2">
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner className="size-6" aria-label={t("playerCompare.loading", { defaultValue: "Loading players" })} />
            </div>
          ) : debouncedSearch.trim().length === 0 ? (
            <div className="flex min-h-48 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              {t("playerCompare.startTyping", { defaultValue: "Start typing to search for a player." })}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              {t("playerCompare.noResults", { defaultValue: "No players found." })}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filteredResults.map((player) => {
                const initials = player.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                const flagUrl = getTeamFlagUrl({ idCountry: player.country_code, teamName: "" }, 20)

                return (
                  <li key={player.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(player.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors",
                        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      <Avatar className="size-9 shrink-0 rounded-full border border-border/50">
                        <AvatarImage src={player.image_url} alt={player.name} className="object-cover" />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{player.name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Avatar className="size-4 rounded-xs border border-border/50">
                            <AvatarImage src={flagUrl} alt={player.country_code} className="object-cover" />
                            <AvatarFallback>{player.country_code.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span>{player.country_code}</span>
                          <span>·</span>
                          <span>{player.position}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
