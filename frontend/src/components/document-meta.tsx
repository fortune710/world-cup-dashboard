import * as React from "react"
import { useLocation } from "react-router"

import {
  getAbsoluteUrl,
  getOgImageUrl,
  SITE_KEYWORDS,
  SITE_NAME,
  TWITTER_HANDLE,
} from "@/lib/seo/site-config"
import {
  getDocumentTitle,
  getRouteDescription,
  getRouteMeta,
  getSiteJsonLd,
} from "@/lib/seo/route-meta"

const JSON_LD_SCRIPT_ID = "wc26-site-json-ld"

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string
): void {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute("content", content)
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`
  )

  if (!element) {
    element = document.createElement("link")
    element.setAttribute("rel", rel)
    document.head.appendChild(element)
  }

  element.setAttribute("href", href)
}

function upsertJsonLd(payload: Record<string, unknown>): void {
  let script = document.getElementById(JSON_LD_SCRIPT_ID)

  if (!script) {
    script = document.createElement("script")
    script.id = JSON_LD_SCRIPT_ID
    script.setAttribute("type", "application/ld+json")
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(payload)
}

export function DocumentMeta() {
  const { pathname } = useLocation()

  React.useEffect(() => {
    const meta = getRouteMeta(pathname)
    const title = getDocumentTitle(pathname)
    const description = getRouteDescription(pathname)
    const canonicalUrl = getAbsoluteUrl(pathname === "/" ? "/" : pathname)
    const ogImageUrl = getOgImageUrl()
    const robotsContent = meta.noIndex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large"

    document.title = title

    upsertMeta("name", "description", description)
    upsertMeta("name", "keywords", SITE_KEYWORDS)
    upsertMeta("name", "robots", robotsContent)
    upsertMeta("name", "application-name", SITE_NAME)

    upsertMeta("property", "og:type", "website")
    upsertMeta("property", "og:site_name", SITE_NAME)
    upsertMeta("property", "og:title", title)
    upsertMeta("property", "og:description", description)
    upsertMeta("property", "og:url", canonicalUrl)
    upsertMeta("property", "og:image", ogImageUrl)
    upsertMeta("property", "og:locale", "en_US")

    upsertMeta("name", "twitter:card", "summary_large_image")
    upsertMeta("name", "twitter:title", title)
    upsertMeta("name", "twitter:description", description)
    upsertMeta("name", "twitter:image", ogImageUrl)
    upsertMeta("name", "twitter:site", TWITTER_HANDLE)

    upsertLink("canonical", canonicalUrl)

    upsertJsonLd({
      ...getSiteJsonLd(),
      url: getAbsoluteUrl("/"),
      headline: meta.heading,
      description,
    })
  }, [pathname])

  return null
}
