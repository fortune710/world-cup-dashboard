import { describe, expect, it } from "bun:test"

import { getPlayerAvatarUrl } from "./player-image"

describe("player image helper", () => {
  it("proxies backend image urls through the frontend api path", () => {
    const imageUrl = "https://img.example.com/player.jpg"

    expect(getPlayerAvatarUrl(imageUrl)).toBe(
      `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
    )
  })

  it("constructs fallback image URL from player ID when imageUrl is missing", () => {
    const playerId = 12345
    const expectedFallbackUrl = `https://img.sofascore.com/api/v1/player/${playerId}/image`
    expect(getPlayerAvatarUrl(null, playerId)).toBe(
      `/api/image-proxy?url=${encodeURIComponent(expectedFallbackUrl)}`
    )
  })

  it("uses cached player avatar URL on subsequent calls with the same player ID", () => {
    const playerId = 999
    const firstCall = getPlayerAvatarUrl("https://example.com/original.jpg", playerId)
    const secondCall = getPlayerAvatarUrl("https://example.com/different.jpg", playerId)
    expect(secondCall).toBe(firstCall)
  })
})

