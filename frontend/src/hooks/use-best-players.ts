// src/hooks/use-best-players.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export interface PlayerPerformance {
  id: string;
  name: string;
  goals?: number;
  assists?: number;
  tackles?: number;
  saves?: number;
  avatarUrl?: string;
}

export interface BestPlayers {
  topScorers: PlayerPerformance[];
  topAssistants: PlayerPerformance[];
  topDefenders: PlayerPerformance[];
  topGoalkeepers: PlayerPerformance[];
}

export function useBestPlayers(teamId: string) {
  const [data, setData] = useState<BestPlayers | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBest() {
      logger.info("Fetching best players", { teamId });
      try {
        const res = await fetch(`/api/teams/${teamId}/best-players`);
        if (!res.ok) throw new Error("Failed to fetch best players");
        const result = await res.json();
        setData(result);
        logger.info("Best players fetched", { teamId });
      } catch (e: any) {
        setError(e.message);
        logger.error("Error fetching best players", { teamId, error: e.message });
      } finally {
        setLoading(false);
      }
    }
    fetchBest();
  }, [teamId]);

  return { data, loading, error };
}
