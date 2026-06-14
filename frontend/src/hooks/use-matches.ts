import { useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import type { LiveRushMatch } from "@/datatypes";
import { API_BASE_URL } from "@/lib/api-config";
import {
  buildMatchesApiPath,
  mapMatchApiRowsToLiveRushMatches,
} from "@/lib/helpers/match.helpers";

function getCurrentUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMatchDateLabel(matchDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${matchDate}T00:00:00Z`));
}

export function useMatches(matchDate: string = getCurrentUtcDate(), status?: string) {
  const [matches, setMatches] = useState<LiveRushMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchMatches() {
      logger.info("Fetching matches from backend", { matchDate, status });
      setError(null);
      setLoading(true);
      try {
        const url = `${API_BASE_URL}${buildMatchesApiPath(matchDate, status)}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();

        if (!active) return;

        const mapped: LiveRushMatch[] = mapMatchApiRowsToLiveRushMatches(data);

        setMatches(mapped);
        logger.info("Matches fetched successfully", { matchDate, count: mapped.length });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching matches", { matchDate, error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMatches();
    return () => {
      active = false;
    };
  }, [matchDate, status]);

  const dateLabel = useMemo(() => formatMatchDateLabel(matchDate), [matchDate]);

  return { matches, loading, error, dateLabel };
}
