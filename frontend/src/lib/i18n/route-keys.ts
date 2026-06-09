export type RouteTranslationKey =
  | "live"
  | "teams"
  | "players"
  | "matches"
  | "bracket"
  | "settings"
  | "help"
  | "notFound"

const ROUTE_TRANSLATION_KEYS: Record<string, RouteTranslationKey> = {
  "/": "live",
  "/teams": "teams",
  "/players": "players",
  "/matches": "matches",
  "/bracket": "bracket",
  "/settings": "settings",
  "/help": "help",
}

export function getRouteTranslationKey(pathname: string): RouteTranslationKey {
  if (pathname.startsWith("/teams/") && pathname.length > "/teams/".length) {
    return "teams"
  }

  if (pathname.startsWith("/players/") && pathname.length > "/players/".length) {
    return "players"
  }

  return ROUTE_TRANSLATION_KEYS[pathname] ?? "notFound"
}
