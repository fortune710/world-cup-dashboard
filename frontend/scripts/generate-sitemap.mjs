import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import process from "node:process"

// Bun (this project's build runtime) auto-loads .env files and has no
// process.loadEnvFile; only call it when running under real Node.
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile()
  } catch {
    // Ignore if .env is missing
  }
}

const LOCALHOST_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
])

const allowLocalhost = process.argv.includes("--allow-localhost")

function resolveSiteUrl() {
  const raw = process.env.VITE_SITE_URL ?? process.env.SITE_URL

  if (!raw?.trim()) {
    if (allowLocalhost) {
      return "http://localhost:5173"
    }

    console.error(
      "error: VITE_SITE_URL (or SITE_URL) is required for sitemap/robots generation.\n" +
        "Set it in .env or the environment, e.g. VITE_SITE_URL=https://your-domain.com\n" +
        "For local-only output, pass --allow-localhost."
    )
    process.exit(1)
  }

  const siteUrl = raw.trim().replace(/\/$/, "")

  try {
    const parsed = new URL(siteUrl)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("must use http or https")
    }
  } catch {
    console.error(`error: Invalid site URL: ${raw}`)
    process.exit(1)
  }

  if (!allowLocalhost && LOCALHOST_ORIGINS.has(siteUrl)) {
    console.error(
      `error: Site URL must not be localhost in production builds: ${siteUrl}\n` +
        "Pass --allow-localhost for local-only generation."
    )
    process.exit(1)
  }

  return siteUrl
}

const siteUrl = resolveSiteUrl()
const lastmod = new Date().toISOString().slice(0, 10)

const routes = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/teams", changefreq: "daily", priority: "0.8" },
  { path: "/players", changefreq: "daily", priority: "0.8" },
  { path: "/matches", changefreq: "hourly", priority: "0.9" },
  { path: "/bracket", changefreq: "daily", priority: "0.9" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
]

const urls = routes
  .map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${siteUrl}${path === "/" ? "/" : path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

const robots = `User-agent: *
Allow: /
Disallow: /settings

Sitemap: ${siteUrl}/sitemap.xml
`

const publicDir = resolve(import.meta.dirname, "../public")

writeFileSync(resolve(publicDir, "sitemap.xml"), sitemap, "utf8")
writeFileSync(resolve(publicDir, "robots.txt"), robots, "utf8")

console.log(`Generated sitemap and robots.txt for ${siteUrl}`)
