// src/hooks/use-last-five-fixtures.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export interface Fixture {
  id: string;
  opponent: string;
  date: string;
  result?: string;
}

export function useLastFiveFixtures(teamId: string) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFixtures() {
      logger.info("Fetching last five fixtures", { teamId });
      try {
        const res = await fetch(`/api/teams/${teamId}/last-five`);
        if (!res.ok) throw new Error("Failed to fetch last five fixtures");
        const data = await res.json();
        setFixtures(data);
        logger.info("Last five fixtures fetched", { teamId, count: data.length });
      } catch (e: any) {
        setError(e.message);
        logger.error("Error fetching last five fixtures", { teamId, error: e.message });
      } finally {
        setLoading(false);
      }
    }
    fetchFixtures();
  }, [teamId]);

  return { fixtures, loading, error };
}
