import * as React from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import type { FormBadgeProps, FormResult } from "@/datatypes"
import type { FormType } from "@/lib/teams/team-form"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatFormLabel(form: (FormResult | FormType)[], t: TFunction): string {
  return form
    .map((item) => {
      const result = typeof item === "string" ? item : item.result
      if (result === "W") {
        return t("common.win")
      }

      if (result === "D") {
        return t("common.draw")
      }

      return t("common.loss")
    })
    .join(", ")
}

export interface FormBadgeExtendedProps extends FormBadgeProps {
  adaptiveHover?: boolean
}

export const FormBadge = React.memo(function FormBadge({
  result,
  adaptiveHover = false,
}: FormBadgeExtendedProps) {
  return (
    <span
      className={cn(
        "inline-flex size-4 items-center justify-center rounded-sm text-[9px] font-semibold tabular-nums sm:size-5 sm:text-[10px]",
        result === "W" && "bg-primary/20 text-primary",
        result === "D" && "bg-muted text-muted-foreground",
        result === "L" && "bg-destructive/15 text-destructive",
        adaptiveHover &&
          result === "W" &&
          "group-hover:bg-primary-foreground/25 group-hover:text-primary-foreground",
        adaptiveHover &&
          result === "D" &&
          "group-hover:bg-primary-foreground/15 group-hover:text-primary-foreground/90",
        adaptiveHover &&
          result === "L" &&
          "group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground"
      )}
    >
      {result}
    </span>
  )
})

export interface TeamFormExtendedProps {
  form: (FormResult | FormType)[] | null
  adaptiveHover?: boolean
  className?: string
}

export const TeamForm = React.memo(function TeamForm({
  form,
  adaptiveHover = false,
  className,
}: TeamFormExtendedProps) {
  const { t } = useTranslation()

  if (!form || form.length === 0) {
    return (
      <span
        className={cn(
          "text-sm text-muted-foreground",
          adaptiveHover && "group-hover:text-primary-foreground/90",
          className
        )}
      >
        —
      </span>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn("flex gap-0.5 sm:gap-1", className)}
        aria-label={t("common.last5Results", {
          results: formatFormLabel(form, t),
        })}
      >
        {form.map((item, index) => {
          const isObj = typeof item === "object" && item !== null
          const result = isObj ? (item as FormType).result : (item as FormResult)
          
          const badge = (
            <FormBadge
              key={`${result}-${index}`}
              result={result}
              adaptiveHover={adaptiveHover}
            />
          )

          if (isObj) {
            const f = item as FormType
            const dateStr = new Date(f.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            return (
              <Tooltip key={f.matchId}>
                <TooltipTrigger asChild>
                  {badge}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-semibold">{f.opponentId}</p>
                  <p className="text-[10px] text-muted-foreground">{f.score} • {dateStr}</p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return badge
        })}
      </div>
    </TooltipProvider>
  )
})
