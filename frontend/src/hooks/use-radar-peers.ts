import useSWR from "swr";
import type { RadarRole } from "../lib/players/player-mapping";
import type { PlayerStatistics } from "../types/player-statistics";
import { API_BASE_URL } from "../lib/api-config";

export interface RadarPeer {
  id: string;
  name: string;
  radarRole: RadarRole;
  statistics: PlayerStatistics;
}

export interface RadarPeersListResponse {
  peers: RadarPeer[];
  total: number;
}

const fetcher = (url: string): Promise<RadarPeersListResponse> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch radar peers");
    return res.json();
  });

export function useRadarPeers(role: RadarRole | undefined) {
  const { data, error, isLoading } = useSWR<RadarPeersListResponse>(
    role ? `${API_BASE_URL}/players/radar-peers?role=${role}&min_minutes=180` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    peers: data?.peers ?? [],
    isLoading,
    error: error ? String(error) : null,
  };
}
