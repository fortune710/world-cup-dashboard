"use client"

import { useTranslation } from "react-i18next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type PlayerRow } from "@/pages/players-page"

function formatMarketValue(value: number | null | undefined): string {
  if (value == null || value === 0) return "—"
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`
  return `€${value.toLocaleString()}`
}

function formatProfileValue(value: string | number | null | undefined, suffix = ""): string {
  if (value == null || value === "") return "—"
  return `${value}${suffix}`
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-2.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function PlayerProfileCard({ player }: { player: PlayerRow }) {
  const { t } = useTranslation()

  const rows = [
    { label: t("playerCompare.profileAge", { defaultValue: "Age" }), value: formatProfileValue(player.age) },
    { label: t("playerCompare.profileHeight", { defaultValue: "Height" }), value: formatProfileValue(player.heightCm, " cm") },
    { label: t("playerCompare.profileWeight", { defaultValue: "Weight" }), value: formatProfileValue(player.weightKg, " kg") },
    { label: t("playerCompare.profileFoot", { defaultValue: "Preferred foot" }), value: formatProfileValue(player.foot) },
    { label: t("playerCompare.profileClub", { defaultValue: "Club" }), value: formatProfileValue(player.clubName) },
    { label: t("playerCompare.profileMarketValue", { defaultValue: "Market value" }), value: formatMarketValue(player.marketValue) },
    { label: t("playerCompare.profilePositions", { defaultValue: "Positions" }), value: formatProfileValue(player.positions) },
  ]

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold tracking-tight">
          {t("playerDetailsPage.profile", { defaultValue: "Player Profile" })}
        </CardTitle>
        <CardDescription>
          {t("playerCompare.profileDescription", { defaultValue: "Physical and background details" })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {rows.map((row) => (
          <ProfileRow key={row.label} label={row.label} value={row.value} />
        ))}
      </CardContent>
    </Card>
  )
}
