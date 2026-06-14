import { describe, expect, it } from "bun:test"

import { getSectionCardsRenderMode } from "./section-cards"

describe("section cards render mode", () => {
  it("shows loading before any error state", () => {
    expect(getSectionCardsRenderMode(true, "failed", false)).toBe("loading")
  })

  it("shows error when loading is done and no data exists", () => {
    expect(getSectionCardsRenderMode(false, "failed", false)).toBe("error")
  })

  it("shows content when cached data exists even if an error is present", () => {
    expect(getSectionCardsRenderMode(false, "failed", true)).toBe("content")
  })
})
