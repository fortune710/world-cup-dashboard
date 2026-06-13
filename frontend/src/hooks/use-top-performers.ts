import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import type { PerformerRow } from "@/datatypes";
import { API_BASE_URL } from "@/lib/api-config";

export interface TopPerformersData {
  goals: PerformerRow[];
  assists: PerformerRow[];
  saves: PerformerRow[];
  rating: PerformerRow[];
}

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

export function useTopPerformers() {
  const [data, setData] = useState<TopPerformersData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchAll() {
      logger.info("Fetching top performers in parallel");
      setLoading(true);
      try {
        setError(null);
        const [goalsRes, assistsRes, cleanSheetsRes, ratingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/players/top/goals`),
          fetch(`${API_BASE_URL}/players/top/assists`),
          fetch(`${API_BASE_URL}/players/top/clean-sheets`),
          fetch(`${API_BASE_URL}/players/top/rating`),
        ]);

        if (!goalsRes.ok || !assistsRes.ok || !cleanSheetsRes.ok || !ratingRes.ok) {
          throw new Error("Failed to fetch top performers data");
        }

        const [goalsData, assistsData, cleanSheetsData, ratingData] = await Promise.all([
          goalsRes.json(),
          assistsRes.json(),
          cleanSheetsRes.json(),
          ratingRes.json(),
        ]);

        if (!active) return;

        const mapPlayerToPerformer = (player: any, valueKey: string): PerformerRow => {
          const initials = player.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2);
          
          const meta = countryMetadata[player.country_code.toUpperCase()] || { group: "A", federation: "UEFA" };
          const positionMap: Record<string, string> = {
            F: "FWD",
            M: "MID",
            D: "DEF",
            G: "GK",
          };

          return {
            name: player.name,
            initials,
            nationality: player.country_code,
            value: player[valueKey] ?? 0,
            avatar: player.image_url || `https://img.sofascore.com/api/v1/player/${player.id}/image`,
            position: positionMap[player.classification] || player.classification || "FWD",
            group: meta.group,
            federation: meta.federation,
            rating: player.rating || 0.0,
          };
        };

        setData({
          goals: goalsData.slice(0, 5).map((p: any) => mapPlayerToPerformer(p, "goals")),
          assists: assistsData.slice(0, 5).map((p: any) => mapPlayerToPerformer(p, "assists")),
          saves: cleanSheetsData.slice(0, 5).map((p: any) => mapPlayerToPerformer(p, "clean_sheets")),
          rating: ratingData.slice(0, 5).map((p: any) => mapPlayerToPerformer(p, "rating")),
        });
        logger.info("Top performers fetched successfully");
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
        logger.error("Error fetching top performers", { error: e.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
