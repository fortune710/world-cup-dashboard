// src/hooks/use-group-standings.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export interface Standing {
  position: number;
  teamName: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
}

export function useGroupStandings(groupId: string) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      logger.info("Fetching group standings", { groupId });
      try {
        const res = await fetch(`/api/groups/${groupId}/standings`);
        if (!res.ok) throw new Error("Failed to fetch group standings");
        const data = await res.json();
        setStandings(data);
        logger.info("Group standings fetched", { groupId, count: data.length });
      } catch (e: any) {
        setError(e.message);
        logger.error("Error fetching group standings", { groupId, error: e.message });
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [groupId]);

  return { standings, loading, error };
}
