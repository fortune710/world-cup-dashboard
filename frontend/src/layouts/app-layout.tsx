import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigation } from "react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { DocumentMeta } from "@/components/document-meta"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const isNavigating = navigation.state !== "idle"

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <DocumentMeta />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        {t("app.skipToContent")}
      </a>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div
          aria-hidden
          className={cn(
            "h-0.5 w-full bg-primary/0 transition-colors duration-200",
            isNavigating && "bg-primary/60"
          )}
        />
        <main id="main-content" className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
