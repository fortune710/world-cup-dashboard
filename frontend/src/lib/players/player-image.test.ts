import { describe, expect, it } from "bun:test"

import { getPlayerAvatarUrl } from "./player-image"
import { API_BASE_URL } from "@/lib/api-config"

describe("player image helper", () => {
  it("proxies raw image urls through the backend image-proxy endpoint", () => {
    const imageUrl = "https://img.example.com/player.jpg"

    expect(getPlayerAvatarUrl(imageUrl)).toBe(
      `${API_BASE_URL}/image-proxy?url=${encodeURIComponent(imageUrl)}`
    )
  })

  it("points backend-relative image urls straight at the backend", () => {
    expect(getPlayerAvatarUrl("/players/42/image")).toBe(
      `${API_BASE_URL}/players/42/image`
    )
  })

  it("constructs fallback image URL from player ID when imageUrl is missing", () => {
    const playerId = 12345
    const expectedFallbackUrl = `https://img.sofascore.com/api/v1/player/${playerId}/image`
    expect(getPlayerAvatarUrl(null, playerId)).toBe(
      `${API_BASE_URL}/image-proxy?url=${encodeURIComponent(expectedFallbackUrl)}`
    )
  })

  it("uses cached player avatar URL on subsequent calls with the same player ID", () => {
    const playerId = 999
    const firstCall = getPlayerAvatarUrl("https://example.com/original.jpg", playerId)
    const secondCall = getPlayerAvatarUrl("https://example.com/different.jpg", playerId)
    expect(secondCall).toBe(firstCall)
  })
})

