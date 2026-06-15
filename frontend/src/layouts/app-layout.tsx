import React, { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigation } from "react-router"

import { DocumentMeta } from "@/components/document-meta"
import { SiteHeader } from "@/components/site-header"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const isNavigating = navigation.state !== "idle"

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DocumentMeta />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        {t("app.skipToContent")}
      </a>

      {/* SiteHeader is now the top navigation bar */}
      <SiteHeader />

      <div
        aria-hidden
        className={cn(
          "h-0.5 w-full bg-primary/0 transition-colors duration-200",
          isNavigating && "bg-primary/60"
        )}
      />

      <main id="main-content" className="flex flex-1 flex-col pb-12">
        <div className="@container/main w-full flex flex-1 flex-col gap-4">
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

