// src/hooks/use-group-standings.ts
import useSWR from "swr";
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

const fetcher = (url: string): Promise<Standing[]> => {
  logger.info("SWR fetching group standings", { url });
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        logger.error("SWR failed to fetch group standings", { url, status: res.status });
        throw new Error("Failed to fetch group standings");
      }
      return res.json();
    })
    .then((data: any) => {
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
      logger.info("SWR fetch group standings successful", { url, count: mapped.length });
      return mapped;
    })
    .catch((err: any) => {
      logger.error("SWR fetch group standings error", { url, error: err.message });
      throw err;
    });
};

export function useGroupStandings(groupId: string) {
  logger.info("Initializing SWR useGroupStandings", { groupId });

  const { data, error, isLoading } = useSWR<Standing[]>(
    groupId ? `${API_BASE_URL}/teams/groups?group=${groupId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    standings: data ?? [],
    loading: isLoading,
    error: error ? error.message : null,
  };
}
