// src/hooks/use-upcoming-fixtures.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export interface Fixture {
  id: string;
  opponent: string;
  date: string;
  venue?: string;
}

export function useUpcomingFixtures(teamId: string) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpcoming() {
      logger.info("Fetching upcoming fixtures", { teamId });
      try {
        const res = await fetch(`/api/teams/${teamId}/upcoming`);
        if (!res.ok) throw new Error("Failed to fetch upcoming fixtures");
        const data = await res.json();
        setFixtures(data);
        logger.info("Upcoming fixtures fetched", { teamId, count: data.length });
      } catch (e: any) {
        setError(e.message);
        logger.error("Error fetching upcoming fixtures", { teamId, error: e.message });
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, [teamId]);

  return { fixtures, loading, error };
}
