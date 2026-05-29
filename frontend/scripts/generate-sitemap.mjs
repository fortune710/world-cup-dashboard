import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const siteUrl = (process.env.VITE_SITE_URL ?? "http://localhost:5173").replace(
  /\/$/,
  ""
)

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
