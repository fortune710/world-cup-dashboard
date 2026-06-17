import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import type { PlayerRow } from "@/pages/players-page";
import { API_BASE_URL } from "@/lib/api-config";
import { getPlayerAvatarUrl } from "@/lib/players/player-image";

const countryMetadata: Record<string, { group: string; federation: string }> = {
  MEX: { group: "A", federation: "CONCACAF" },
  KOR: { group: "A", federation: "AFC" },
  RSA: { group: "A", federation: "CAF" },
  CZE: { group: "A", federation: "UEFA" },
  POL: { group: "A", federation: "UEFA" },
  CAN: { group: "B", federation: "CONCACAF" },
  SUI: { group: "B", federation: "UEFA" },
  QAT: { group: "B", federation: "AFC" },
  BIH: { group: "B", federation: "UEFA" },
  BRA: { group: "C", federation: "CONMEBOL" },
  MAR: { group: "C", federation: "CAF" },
  SCO: { group: "C", federation: "UEFA" },
  HAI: { group: "C", federation: "CONCACAF" },
  USA: { group: "D", federation: "CONCACAF" },
  AUS: { group: "D", federation: "AFC" },
  PAR: { group: "D", federation: "CONMEBOL" },
  TUR: { group: "D", federation: "UEFA" },
  GER: { group: "E", federation: "UEFA" },
  ECU: { group: "E", federation: "CONMEBOL" },
  CIV: { group: "E", federation: "CAF" },
  CUW: { group: "E", federation: "CONCACAF" },
  NED: { group: "F", federation: "UEFA" },
  JPN: { group: "F", federation: "AFC" },
  TUN: { group: "F", federation: "CAF" },
  SWE: { group: "F", federation: "UEFA" },
  BEL: { group: "G", federation: "UEFA" },
  IRN: { group: "G", federation: "AFC" },
  EGY: { group: "G", federation: "CAF" },
  NZL: { group: "G", federation: "OFC" },
  ESP: { group: "H", federation: "UEFA" },
  URU: { group: "H", federation: "CONMEBOL" },
  KSA: { group: "H", federation: "AFC" },
  CPV: { group: "H", federation: "CAF" },
  FRA: { group: "I", federation: "UEFA" },
  SEN: { group: "I", federation: "CAF" },
  NOR: { group: "I", federation: "UEFA" },
  IRQ: { group: "I", federation: "AFC" },
  ARG: { group: "J", federation: "CONMEBOL" },
  AUT: { group: "J", federation: "UEFA" },
  ALG: { group: "J", federation: "CAF" },
  JOR: { group: "J", federation: "AFC" },
  POR: { group: "K", federation: "UEFA" },
  COL: { group: "K", federation: "CONMEBOL" },
  UZB: { group: "K", federation: "AFC" },
  COD: { group: "K", federation: "CAF" },
  ENG: { group: "L", federation: "UEFA" },
  CRO: { group: "L", federation: "UEFA" },
  PAN: { group: "L", federation: "CONCACAF" },
  GHA: { group: "L", federation: "CAF" },
};

export function usePlayerDetails(playerId: string | undefined) {
  const [player, setPlayer] = useState<PlayerRow | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      setPlayer(undefined);
      setError(null);
      return;
    }
    let active = true;

    async function fetchDetails() {
      logger.info("Fetching player details in parallel", { playerId });
      setError(null);
      setLoading(true);
      try {
        const [infoRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/players/${playerId}/info`),
          fetch(`${API_BASE_URL}/players/${playerId}/statistics`),
        ]);

        if (!infoRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch player details");
        }

        const [infoData, statsData] = await Promise.all([
          infoRes.json(),
          statsRes.json(),
        ]);

        if (!active) return;

        const stats = statsData.statistics || {};
        const positionMap: Record<string, string> = {
          F: "FWD",
          M: "MID",
          D: "DEF",
          G: "GK",
        };

        const meta = countryMetadata[infoData.country_code.toUpperCase()] || { group: "A", federation: "UEFA" };

        const mapped: PlayerRow = {
          id: infoData.id,
          name: infoData.name,
          position: positionMap[infoData.classification] || infoData.classification || "FWD",
          country: infoData.country_code,
          federation: meta.federation,
          group: meta.group,
          gamesPlayed: stats.appearances ?? 0,
          minutesPlayed: stats.minutes_played ?? 0,
          goals: stats.goals ?? 0,
          assists: stats.assists ?? 0,
          xg: stats.expected_goals ?? 0.0,
          xa: stats.expected_assists ?? 0.0,
          yellowCards: stats.yellow_cards ?? 0,
          redCards: stats.red_cards ?? 0,
          rating: infoData.rating ?? stats.rating ?? 0.0,
          injuryStatus: infoData.injury_status || "Fit",
          cleanSheets: stats.clean_sheet ?? 0,
          avatar: getPlayerAvatarUrl(infoData.id),
        };

        setPlayer(mapped);
        logger.info("Player details fetched successfully", { playerId });
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching player details", { playerId, error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDetails();
    return () => {
      active = false;
    };
  }, [playerId]);

  return { player, loading, error };
}
