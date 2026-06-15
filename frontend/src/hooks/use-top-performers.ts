import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { logger } from "@/lib/logger";
import { API_BASE_URL } from "@/lib/api-config";
import {
  buildTopPerformersData,
  createTopPerformersSWRConfig,
  TOP_PERFORMERS_ENDPOINTS,
} from "@/lib/helpers/top-performers.helpers";

type TopPerformerApiPlayer = {
  id: number;
  name: string;
  country_code?: string | null;
  image_url?: string | null;
  classification?: string | null;
  rating?: number | null;
  goals?: number | null;
  assists?: number | null;
  saves?: number | null;
};

const TOP_STATS_LIMIT = 3;
const swrConfig = createTopPerformersSWRConfig();
const topPerformersKeys = {
  goals: `${API_BASE_URL}${TOP_PERFORMERS_ENDPOINTS.goals}?limit=${TOP_STATS_LIMIT}`,
  assists: `${API_BASE_URL}${TOP_PERFORMERS_ENDPOINTS.assists}?limit=${TOP_STATS_LIMIT}`,
  saves: `${API_BASE_URL}${TOP_PERFORMERS_ENDPOINTS.saves}?limit=${TOP_STATS_LIMIT}`,
  rating: `${API_BASE_URL}${TOP_PERFORMERS_ENDPOINTS.rating}?limit=${TOP_STATS_LIMIT}`,
} as const;

async function fetchTopPerformersBucket(url: string): Promise<TopPerformerApiPlayer[]> {
  logger.info("Fetching top performers bucket", { url });
  const response = await fetch(url);

  if (!response.ok) {
    logger.error("Failed to fetch top performers bucket", {
      url,
      status: response.status,
    });
    throw new Error("Failed to fetch top performers data");
  }

  const data = (await response.json()) as TopPerformerApiPlayer[];
  logger.info("Fetched top performers bucket", { url, count: data.length });
  return data;
}

export function useTopPerformers() {
  const goals = useSWR<TopPerformerApiPlayer[]>(
    topPerformersKeys.goals,
    fetchTopPerformersBucket,
    swrConfig
  );
  const assists = useSWR<TopPerformerApiPlayer[]>(
    topPerformersKeys.assists,
    fetchTopPerformersBucket,
    swrConfig
  );
  const saves = useSWR<TopPerformerApiPlayer[]>(
    topPerformersKeys.saves,
    fetchTopPerformersBucket,
    swrConfig
  );
  const rating = useSWR<TopPerformerApiPlayer[]>(
    topPerformersKeys.rating,
    fetchTopPerformersBucket,
    swrConfig
  );

  useEffect(() => {
    logger.info("Evaluating top performers SWR state", {
      goalsLoading: goals.isLoading,
      assistsLoading: assists.isLoading,
      savesLoading: saves.isLoading,
      ratingLoading: rating.isLoading,
    });
  }, [
    goals.isLoading,
    assists.isLoading,
    saves.isLoading,
    rating.isLoading,
  ]);

  const data = useMemo(() => {
    if (!goals.data || !assists.data || !saves.data || !rating.data) {
      return null;
    }

    const mapped = buildTopPerformersData(
      goals.data,
      assists.data,
      saves.data,
      rating.data
    );
    logger.info("Top performers fetched successfully", {
      goals: mapped.goals.length,
      assists: mapped.assists.length,
      saves: mapped.saves.length,
      rating: mapped.rating.length,
    });
    return mapped;
  }, [goals.data, assists.data, saves.data, rating.data]);

  const loading = goals.isLoading || assists.isLoading || saves.isLoading || rating.isLoading;
  const error = goals.error || assists.error || saves.error || rating.error;

  return {
    data,
    loading,
    error: error ? error.message : null,
  };
}
