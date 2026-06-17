import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import type { PlayerRow } from "@/pages/players-page";
import { API_BASE_URL } from "@/lib/api-config";
import { getPlayerAvatarUrl } from "@/lib/players/player-image";
import { getFederationByCountryCode } from "@/lib/helpers/federation.helpers";

export function usePlayers(limit: number = 100, search?: string, classification?: string) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchPlayers() {
      logger.info("Fetching players", { limit, search, classification });
      setError(null);
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("limit", String(limit));
        if (search) queryParams.append("search", search);
        if (classification && classification !== "all") {
          const classificationMap: Record<string, string> = {
            FWD: "F",
            MID: "M",
            DEF: "D",
            GK: "G",
          };
          const mappedClass = classificationMap[classification];
          if (mappedClass) {
            queryParams.append("classification", mappedClass);
          }
        }

        const res = await fetch(`${API_BASE_URL}/players?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch players leaderboard");
        const data = await res.json();

        if (!active) return;

        const mapped: PlayerRow[] = data.map((p: any) => {
          const stats = p.statistics || {};
          const positionMap: Record<string, string> = {
            F: "FWD",
            M: "MID",
            D: "DEF",
            G: "GK",
          };

          return {
            id: p.id,
            name: p.player_name,
            position: positionMap[p.classification] || p.classification || "FWD",
            country: p.country_code,
            federation: p.federation || getFederationByCountryCode(p.country_code) || "—",
            group: p.group || "A",
            gamesPlayed: stats.appearances ?? 0,
            minutesPlayed: stats.minutes_played ?? 0,
            goals: stats.goals ?? 0,
            assists: stats.assists ?? 0,
            xg: stats.expected_goals ?? 0.0,
            xa: stats.expected_assists ?? 0.0,
            yellowCards: stats.yellow_cards ?? 0,
            redCards: stats.red_cards ?? 0,
            rating: stats.rating ?? 0.0,
            injuryStatus: p.injury_status || "Fit",
            cleanSheets: stats.clean_sheets ?? 0,
            avatar: getPlayerAvatarUrl(p.id),
          };
        });

        setPlayers(mapped);
        logger.info("Players fetched successfully", { count: mapped.length });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching players", { error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchPlayers();
    return () => {
      active = false;
    };
  }, [limit, search, classification]);

  return { players, loading, error };
}
