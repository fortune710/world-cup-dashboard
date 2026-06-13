// src/hooks/use-group-standings.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import { API_BASE_URL } from "@/lib/api-config";

export interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDifference: number;
  points: number;
  code: string;
}

export function useGroupStandings(groupId: string) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchStandings() {
      logger.info("Fetching group standings", { groupId });
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/teams/groups?name=${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch group standings");
        const data = await res.json();
        
        if (!active) return;

        const mapped: Standing[] = data.map((item: any, index: number) => ({
          position: index + 1,
          team: item.name,
          played: item.matches_played,
          won: item.matches_won,
          drawn: item.matches_drawn,
          lost: item.matches_lost,
          goalDifference: item.goal_difference,
          points: item.points,
          code: item.code,
        }));

        setStandings(mapped);
        logger.info("Group standings fetched", { groupId, count: mapped.length });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching group standings", { groupId, error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchStandings();
    return () => {
      active = false;
    };
  }, [groupId]);

  return { standings, loading, error };
}
