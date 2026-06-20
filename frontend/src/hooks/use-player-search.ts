import useSWR from "swr";
import { logger } from "@/lib/logger";
import { API_BASE_URL } from "@/lib/api-config";

export interface PlayerSearchResult {
  id: number;
  name: string;
  country_code: string;
  position: string;
  image_url: string;
}

export interface PlayerSearchParams {
  query: string;
  limit?: number;
  enabled?: boolean;
}

function resolvePlayerImageUrl(imageUrl: string, playerId: number): string {
  if (imageUrl.startsWith("/players/")) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  if (imageUrl.startsWith("http")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  return `${API_BASE_URL}/players/${playerId}/image`;
}

const fetcher = (url: string): Promise<PlayerSearchResult[]> => {
  logger.info("SWR fetching player search results", { url });
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        logger.error("SWR failed to fetch player search results", { url, status: res.status });
        throw new Error("Failed to search players");
      }
      return res.json();
    })
    .then((data: PlayerSearchResult[]) => {
      logger.info("SWR fetch player search successful", { url, count: data.length });
      return data.map((player) => ({
        ...player,
        image_url: resolvePlayerImageUrl(player.image_url, player.id),
      }));
    })
    .catch((err: unknown) => {
      const error = err as Error;
      logger.error("SWR fetch player search error", { url, error: error.message });
      throw error;
    });
};

export function usePlayerSearch(params: PlayerSearchParams) {
  const { query, limit = 5, enabled = true } = params;
  const trimmedQuery = query.trim();

  const queryParams = new URLSearchParams();
  queryParams.append("query", trimmedQuery);
  queryParams.append("limit", String(limit));

  logger.info("Initializing SWR usePlayerSearch", { query: trimmedQuery, limit, enabled });

  const { data, error, isLoading, mutate } = useSWR(
    enabled && trimmedQuery.length > 0
      ? `${API_BASE_URL}/players/search?${queryParams.toString()}`
      : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  return {
    results: data ?? [],
    isLoading,
    error: error ? error.message : null,
    mutate,
  };
}
