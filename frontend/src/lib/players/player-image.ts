import { API_BASE_URL } from "@/lib/api-config"

/** Player photos must load via our API — Sofascore blocks direct browser hotlinking in production. */
export function getPlayerAvatarUrl(playerId: number | string): string {
  return `${API_BASE_URL}/players/${playerId}/image`
}
