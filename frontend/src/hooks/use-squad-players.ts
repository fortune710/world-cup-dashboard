// src/hooks/use-squad-players.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export interface PlayerInfo {
  id: string;
  name: string;
  position: string;
  avatarUrl?: string;
}

export function useSquadPlayers(teamId: string) {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      logger.info("Fetching squad players", { teamId });
      try {
        const res = await fetch(`/api/teams/${teamId}/squad`);
        if (!res.ok) throw new Error("Failed to fetch squad players");
        const data = await res.json();
        setPlayers(data);
        logger.info("Squad players fetched", { teamId, count: data.length });
      } catch (e: any) {
        setError(e.message);
        logger.error("Error fetching squad players", { teamId, error: e.message });
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, [teamId]);

  return { players, loading, error };
}
