// src/hooks/use-team-stats.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export interface TeamStats {
  bestAttribute: string;
  bestValue: number;
  worstAttribute: string;
  worstValue: number;
}

export function useTeamStats(teamId: string) {
  const [data, setData] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      logger.info("Fetching team stats", { teamId });
      try {
        // Placeholder fetch - replace with real API
        const response = await fetch(`/api/teams/${teamId}/stats`);
        if (!response.ok) throw new Error("Failed to fetch team stats");
        const result = await response.json();
        setData(result);
        logger.info("Team stats fetched successfully", { teamId, result });
      } catch (e: any) {
        setError(e.message);
        logger.error("Error fetching team stats", { teamId, error: e.message });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [teamId]);

  return { data, loading, error };
}
