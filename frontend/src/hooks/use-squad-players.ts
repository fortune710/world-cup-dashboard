// src/hooks/use-squad-players.ts
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import { API_BASE_URL } from "@/lib/api-config";
import { normalizePlayer, type Classification, type DisplayPosition, type RadarRole } from "@/lib/players/player-mapping";

export interface PlayerInfo {
  id: string;
  name: string;
  position: string;
  avatarUrl?: string;
  classification?: Classification;
  positions?: string;
  displayPosition?: DisplayPosition;
  radarRole?: RadarRole;
}

export function useSquadPlayers(teamId: string | undefined) {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const refetch = () => setReloadTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      setPlayers([]);
      setError(null);
      return;
    }
    let active = true;
    async function fetchPlayers() {
      logger.info("Fetching squad players", { teamId });
      setError(null);
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/teams/players/${teamId}`);
        if (!res.ok) throw new Error("Failed to fetch squad players");
        const data = await res.json();
        
        if (!active) return;

        const positionDisplayMap: Record<string, string> = {
          F: "FWD",
          M: "MID",
          D: "DEF",
          G: "GK",
        };

        const mapped = data.map((p: any) => {
          const safeClassification = (p.classification === "G" || p.classification === "D" || p.classification === "M" || p.classification === "F" ? p.classification : "F") as Classification;
          const positions = p.positionsDetailed ?? p.positions_detailed ?? p.position ?? "";

          return normalizePlayer({
            id: String(p.id),
            name: p.name,
            position: positionDisplayMap[p.classification] || p.classification,
            avatarUrl: p.image_url || `https://img.sofascore.com/api/v1/player/${p.id}/image`,
            classification: safeClassification,
            positions: positions,
          });
        });

        setPlayers(mapped);
        logger.info("Squad players fetched", { teamId, count: mapped.length });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching squad players", { teamId, error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchPlayers();
    return () => {
      active = false;
    };
  }, [teamId, reloadTrigger]);

  return { players, loading, error, refetch };
}
