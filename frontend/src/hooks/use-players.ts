import useSWR from "swr";
import { logger } from "@/lib/logger";
import type { PlayerRow } from "@/pages/players-page";
import { API_BASE_URL } from "@/lib/api-config";
import { normalizePlayer, type Classification } from "@/lib/players/player-mapping";
import { getFederationByCountryCode } from "@/lib/helpers/federation.helpers";
import { getPlayerAvatarUrl } from "@/lib/players/player-image";
import { countryMetadata } from "@/lib/teams/wc26-teams";

export interface PlayersParams {
  search?: string;
  position?: string;
  team?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

interface FetcherResult {
  players: PlayerRow[];
  total: number;
}

const fetcher = (url: string): Promise<FetcherResult> => {
  logger.info("SWR fetching players", { url });
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        logger.error("SWR failed to fetch players", { url, status: res.status });
        throw new Error("Failed to fetch players");
      }
      return res.json();
    })
    .then((data: unknown) => {
      const rawData = data as Array<{
        id: number;
        player_name: string;
        classification: string;
        positions_detailed?: string;
        positionsDetailed?: string;
        position?: string;
        country_code: string;
        federation?: string;
        group?: string;
        injury_status?: "Fit" | "injured" | "questionable";
        image_url?: string;
        statistics?: {
          appearances?: number;
          minutes_played?: number;
          goals?: number;
          assists?: number;
          expected_goals?: number;
          expected_assists?: number;
          yellow_cards?: number;
          red_cards?: number;
          rating?: number;
          clean_sheets?: number;
          saves?: number;
        };
      }>;

      const positionMap: Record<string, string> = {
        F: "FWD",
        M: "MID",
        D: "DEF",
        G: "GK",
      };

      const players: PlayerRow[] = rawData.map((p) => {
        const stats = p.statistics || {};
        const safeClassification = (p.classification === "G" || p.classification === "D" || p.classification === "M" || p.classification === "F" ? p.classification : "F") as Classification;
        const positions = p.positionsDetailed ?? p.positions_detailed ?? p.position ?? "";
        const meta = countryMetadata[p.country_code.toUpperCase()] || { group: "A", federation: null };
        const federation = p.federation || getFederationByCountryCode(p.country_code) || "—";

        return normalizePlayer({
          id: p.id,
          name: p.player_name,
          position: positionMap[p.classification] || p.classification || "FWD",
          country: p.country_code,
          federation,
          group: p.group || meta.group,
          gamesPlayed: stats.appearances ?? 0,
          minutesPlayed: stats.minutes_played ?? 0,
          goals: stats.goals ?? 0,
          assists: stats.assists ?? 0,
          xg: stats.expected_goals ?? 0.0,
          xa: stats.expected_assists ?? 0.0,
          yellowCards: stats.yellow_cards ?? 0,
          redCards: stats.red_cards ?? 0,
          rating: stats.rating ?? 0.0,
          injuryStatus: p.injury_status || "Fit",
          cleanSheets: stats.clean_sheets ?? 0,
          saves: stats.saves ?? 0,
          avatar: getPlayerAvatarUrl(p.image_url, p.id),
          classification: safeClassification,
          positions: positions,
        });
      });

      logger.info("SWR fetch players successful", { url, count: players.length });
      return {
        players,
        total: players.length,
      };
    })
    .catch((err: unknown) => {
      const error = err as Error;
      logger.error("SWR fetch players error", { url, error: error.message });
      throw error;
    });
};

export function usePlayers(params: PlayersParams = {}) {
  const { search, position, team, page, limit, enabled = true } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("limit", String(limit ?? 50));
  if (search) queryParams.append("search", search);

  if (position && position !== "all") {
    const positionMap: Record<string, string> = {
      FWD: "F",
      MID: "M",
      DEF: "D",
      GK: "G",
    };
    const mappedClass = positionMap[position] || position;
    queryParams.append("classification", mappedClass);
  }

  if (team) queryParams.append("team", team);
  if (page) queryParams.append("page", String(page));

  logger.info("Initializing SWR usePlayers", { search, position, team, page, limit });

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? `${API_BASE_URL}/players?${queryParams.toString()}` : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  return {
    players: data?.players ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error ? error.message : null,
    mutate,
  };
}
