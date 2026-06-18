import { useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import type { LiveRushMatch } from "@/datatypes";
import { API_BASE_URL } from "@/lib/api-config";
import {
  buildMatchesApiPath,
  getCurrentLocalDate,
  mapMatchApiRowsToLiveRushMatches,
} from "@/lib/helpers/match.helpers";

function formatMatchDateLabel(matchDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${matchDate}T00:00:00Z`));
}

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function useMatches(matchDate: string = getCurrentLocalDate(), status?: string) {
  const [matches, setMatches] = useState<LiveRushMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const refetch = () => setReloadTrigger((prev) => prev + 1);

  const timezone = useMemo(() => getBrowserTimezone(), []);

  useEffect(() => {
    let active = true;
    async function fetchMatches() {
      logger.info("Fetching matches from backend", { matchDate, status, timezone });
      setError(null);
      setLoading(true);
      try {
        const url = `${API_BASE_URL}${buildMatchesApiPath(matchDate, status, timezone)}`;
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
  }, [matchDate, status, reloadTrigger]);

  const dateLabel = useMemo(() => formatMatchDateLabel(matchDate), [matchDate]);

  return { matches, loading, error, dateLabel, refetch };
}
