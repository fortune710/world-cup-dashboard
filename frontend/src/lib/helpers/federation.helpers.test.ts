import { describe, expect, it } from "bun:test"

import { getFederationByCountryCode } from "./federation.helpers"

describe("federation helpers", () => {
  it("maps known country codes to federations and leaves unknown codes empty", () => {
    expect(getFederationByCountryCode("ARG")).toBe("CONMEBOL")
    expect(getFederationByCountryCode("FRA")).toBe("UEFA")
    expect(getFederationByCountryCode("ZZZ")).toBeNull()
  })
})
