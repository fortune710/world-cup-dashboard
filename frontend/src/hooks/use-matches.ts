import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import type { LiveRushMatch } from "@/datatypes";
import { API_BASE_URL } from "@/lib/api-config";

export function useMatches(status?: string, page: number = 1, pageSize: number = 20) {
  const [matches, setMatches] = useState<LiveRushMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchMatches() {
      logger.info("Fetching matches from backend", { status, page, pageSize });
      setError(null);
      setLoading(true);
      try {
        const url = `${API_BASE_URL}/matches?page=${page}&page_size=${pageSize}${status ? `&status=${status}` : ""}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();

        if (!active) return;

        const mapped: LiveRushMatch[] = data.map((m: any) => {
          let mappedStatus: "finished" | "live" | "upcoming" = "upcoming";
          const statusLower = String(m.status).toLowerCase();
          if (statusLower === "ft" || statusLower === "finished" || statusLower === "ended") {
            mappedStatus = "finished";
          } else if (statusLower === "live" || statusLower === "ht" || statusLower === "active" || statusLower.includes("min")) {
            mappedStatus = "live";
          }

          let kickoffLabel = "";
          if (mappedStatus === "finished") {
            kickoffLabel = "FT";
          } else if (mappedStatus === "live") {
            kickoffLabel = m.status === "HT" ? "HT" : "Live";
          } else {
            const date = new Date(m.kickoff_utc);
            kickoffLabel = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }

          return {
            id: String(m.id),
            homeTeam: m.home_team?.name || m.home_team_code,
            awayTeam: m.away_team?.name || m.away_team_code,
            homeScore: m.home_score,
            awayScore: m.away_score,
            kickoffLabel,
            status: mappedStatus,
            group: m.group,
          };
        });

        setMatches(mapped);
        logger.info("Matches fetched successfully", { count: mapped.length });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching matches", { error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMatches();
    return () => {
      active = false;
    };
  }, [status, page, pageSize]);

  return { matches, loading, error };
}
