/** Production canonical origin — set VITE_SITE_URL at build/deploy time */
export const SITE_URL =
  import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:5173"

export const SITE_NAME = "World Cup 2026 Dashboard"

export const SITE_TAGLINE = "Live scores, standings, and tournament analytics"

export const DEFAULT_DESCRIPTION =
  "Track FIFA World Cup 2026 live matches, group standings, power rankings, top performers, and knockout brackets in one real-time dashboard."

export const SITE_KEYWORDS = [
  "World Cup 2026",
  "FIFA World Cup",
  "live scores",
  "group standings",
  "power rankings",
  "xG",
  "tournament bracket",
  "soccer dashboard",
  "football analytics",
].join(", ")

export const TWITTER_HANDLE = "@wc26dashboard"

export const OG_IMAGE_PATH = "/og-cover.svg"

export function getAbsoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  if (normalizedPath === "/") {
    return SITE_URL
  }
  return `${SITE_URL}${normalizedPath}`
}

export function getOgImageUrl(): string {
  return getAbsoluteUrl(OG_IMAGE_PATH)
}

export function formatPageTitle(pageTitle: string): string {
  return `${pageTitle} · ${SITE_NAME}`
}
