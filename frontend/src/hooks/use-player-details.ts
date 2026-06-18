import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import type { PlayerRow } from "@/pages/players-page";
import { API_BASE_URL } from "@/lib/api-config";
import { normalizePlayer, type Classification } from "@/lib/players/player-mapping";
import { countryMetadata } from "@/lib/teams/wc26-teams";

export function usePlayerDetails(playerId: string | undefined) {
  const [player, setPlayer] = useState<PlayerRow | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const refetch = () => setReloadTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      setPlayer(undefined);
      setError(null);
      return;
    }
    let active = true;

    async function fetchDetails() {
      logger.info("Fetching player details in parallel", { playerId });
      setError(null);
      setLoading(true);
      try {
        const [infoRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/players/${playerId}/info`),
          fetch(`${API_BASE_URL}/players/${playerId}/statistics`),
        ]);

        if (!infoRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch player details");
        }

        const [infoData, statsData] = await Promise.all([
          infoRes.json(),
          statsRes.json(),
        ]);

        if (!active) return;

        const stats = statsData.statistics || {};
        const positionMap: Record<string, string> = {
          F: "FWD",
          M: "MID",
          D: "DEF",
          G: "GK",
        };

        const meta = countryMetadata[infoData.country_code.toUpperCase()] || { group: "A", federation: "UEFA" };

        const safeClassification = (infoData.classification === "G" || infoData.classification === "D" || infoData.classification === "M" || infoData.classification === "F" ? infoData.classification : "F") as Classification;
        const positions = infoData.positionsDetailed ?? infoData.positions_detailed ?? infoData.position ?? "";

        const mapped: PlayerRow = normalizePlayer({
          id: infoData.id,
          name: infoData.name,
          position: positionMap[infoData.classification] || infoData.classification || "FWD",
          country: infoData.country_code,
          federation: meta.federation,
          group: meta.group,
          gamesPlayed: stats.appearances ?? 0,
          minutesPlayed: stats.minutes_played ?? 0,
          goals: stats.goals ?? 0,
          assists: stats.assists ?? 0,
          xg: stats.expected_goals ?? 0.0,
          xa: stats.expected_assists ?? 0.0,
          yellowCards: stats.yellow_cards ?? 0,
          redCards: stats.red_cards ?? 0,
          rating: infoData.rating ?? stats.rating ?? 0.0,
          injuryStatus: infoData.injury_status || "Fit",
          cleanSheets: stats.clean_sheet ?? 0,
          saves: stats.saves ?? 0,
          avatar: infoData.image_url || `https://img.sofascore.com/api/v1/player/${infoData.id}/image`,
          classification: safeClassification,
          positions: positions,
          statistics: statsData.statistics || undefined,
        });

        setPlayer(mapped);
        logger.info("Player details fetched successfully", { playerId });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching player details", { playerId, error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDetails();
    return () => {
      active = false;
    };
  }, [playerId, reloadTrigger]);

  return { player, loading, error, refetch };
}
