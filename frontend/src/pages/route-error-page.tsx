import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  isRouteErrorResponse,
  Link,
  useRouteError,
} from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function toSupportRef(value: string): string {
  const cleaned = value.replaceAll(/[^a-zA-Z0-9]/g, "")
  return cleaned.length > 0 ? cleaned.slice(0, 8).toUpperCase() : "UNKNOWN"
}

export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()
  const supportRef = React.useMemo(() => {
    const raw = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    return toSupportRef(raw)
  }, [])

  React.useEffect(() => {
    console.error(`[RouteErrorPage ref=${supportRef}]`, error)
  }, [error, supportRef])

  const safeCopy = React.useMemo(() => {
    if (isRouteErrorResponse(error) && error.status === 404) {
      return {
        title: t("routes.notFound", { defaultValue: "Page not found" }),
        message: t("routes.descriptions.notFound", {
          defaultValue: "The page you requested is not available on this dashboard.",
        }),
      }
    }

    if (isRouteErrorResponse(error) && error.status >= 500) {
      return {
        title: t("common.pageLoadFailedTitle", {
          defaultValue: "This page didn’t load",
        }),
        message: t("common.pageLoadFailedMessage", {
          defaultValue:
            "There was a temporary problem loading this page. Try again in a moment.",
        }),
      }
    }

    return {
      title: t("common.pageLoadFailedTitle", { defaultValue: "This page didn’t load" }),
      message: t("common.pageLoadFailedMessage", {
        defaultValue:
          "There was a temporary problem loading this page. Try again in a moment.",
      }),
    }
  }, [error, t])

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 lg:px-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{safeCopy.title}</CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              {t("common.supportRef", { defaultValue: "Ref" })} {supportRef}
            </Badge>
          </div>
          <CardDescription>
            {safeCopy.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("common.errorHelpText", {
              defaultValue:
                "If this keeps happening, refresh the page or return home. If you contact support, share the reference code above.",
            })}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link to="/">{t("common.goHome", { defaultValue: "Go home" })}</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>
            {t("common.reload", { defaultValue: "Reload" })}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

