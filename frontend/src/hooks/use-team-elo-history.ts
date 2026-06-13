import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export interface EloHistoryPoint {
  matchId: number;
  teamCode: string;
  opponentCode: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  expectedScore: number;
  actualScore: number;
}

export function useTeamEloHistory(teamCode: string | undefined) {
  const [history, setHistory] = useState<EloHistoryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamCode) return;
    let active = true;

    async function fetchEloHistory() {
      logger.info("Fetching ELO history", { teamCode });
      setLoading(true);
      try {
        const res = await fetch(`/api/ratings/elo/${teamCode}/history`);
        if (!res.ok) throw new Error("Failed to fetch ELO history");
        const data = await res.json();

        if (!active) return;

        const mapped: EloHistoryPoint[] = data.map((row: any) => ({
          matchId: row.match_id,
          teamCode: row.team_code,
          opponentCode: row.opponent_code,
          ratingBefore: row.rating_before,
          ratingAfter: row.rating_after,
          ratingDelta: row.rating_delta,
          expectedScore: row.expected_score,
          actualScore: row.actual_score,
        }));

        setHistory(mapped);
        logger.info("ELO history fetched successfully", { teamCode, count: mapped.length });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching ELO history", { teamCode, error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEloHistory();
    return () => {
      active = false;
    };
  }, [teamCode]);

  return { history, loading, error };
}
