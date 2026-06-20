import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "bun:test"

const configPath = path.resolve(import.meta.dir, "../../vercel.json")

describe("Vercel routing config", () => {
  it("keeps API requests separate from the SPA history fallback", () => {
    expect(existsSync(configPath)).toBe(true)

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      rewrites?: Array<{ source: string; destination: string }>
    }

    expect(config.rewrites).toEqual([
      { source: "/:path((?!api).*)", destination: "/index.html" },
    ])
  })
})
