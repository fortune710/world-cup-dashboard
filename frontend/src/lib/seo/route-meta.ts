import {
  DEFAULT_DESCRIPTION,
  formatPageTitle,
  SITE_NAME,
} from "@/lib/seo/site-config"

export interface RouteMeta {
  /** Visible page heading (also used for document title suffix) */
  heading: string
  description: string
  /** When true, adds noindex to discourage indexing (settings, errors) */
  noIndex?: boolean
}

const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    heading: "Live",
    description:
      "Live World Cup 2026 match rush, group standings, Elo power rankings, xG stats, and top performers updated through the tournament.",
  },
  "/teams": {
    heading: "Teams",
    description:
      "Browse all World Cup 2026 teams with squad info, form, and tournament performance metrics.",
  },
  "/players": {
    heading: "Players",
    description:
      "World Cup 2026 player stats — goals, assists, saves, and standout performers across the tournament.",
  },
  "/matches": {
    heading: "Matches",
    description:
      "Full World Cup 2026 match schedule and results with kickoff times, groups, and final scores.",
  },
  "/bracket": {
    heading: "Bracket",
    description:
      "Knockout bracket for World Cup 2026 — follow the path from Round of 32 to the final.",
  },
  "/settings": {
    heading: "Settings",
    description: "Dashboard preferences and display options.",
    noIndex: true,
  },
  "/help": {
    heading: "Help",
    description:
      "How to use the World Cup 2026 dashboard — live data, standings, rankings, and navigation.",
  },
}

const NOT_FOUND_META: RouteMeta = {
  heading: "Page not found",
  description: `The page you requested is not available on ${SITE_NAME}.`,
  noIndex: true,
}

export function getRouteMeta(pathname: string): RouteMeta {
  return ROUTE_META[pathname] ?? NOT_FOUND_META
}

export function getDocumentTitle(pathname: string): string {
  const meta = getRouteMeta(pathname)
  return formatPageTitle(meta.heading)
}

export function getRouteHeading(pathname: string): string {
  return getRouteMeta(pathname).heading
}

export function getRouteDescription(pathname: string): string {
  const meta = getRouteMeta(pathname)
  return meta.description || DEFAULT_DESCRIPTION
}

export function getSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    about: {
      "@type": "SportsEvent",
      name: "FIFA World Cup 2026",
      sport: "Soccer",
    },
  }
}
