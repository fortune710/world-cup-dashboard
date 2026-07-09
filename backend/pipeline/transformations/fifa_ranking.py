import io
import logging
from datetime import date

import pandas as pd

logger = logging.getLogger(__name__)

# Actual World Cup opening-match dates. Fixed historical facts, not derivable from
# `historical_matches` (which only holds knockout fixtures, i.e. weeks into each
# tournament) -- home/away_fifa_rank needs to reflect the rank as of the tournament's
# actual kickoff.
TOURNAMENT_START_DATES = {
    2010: date(2010, 6, 11),
    2014: date(2014, 6, 12),
    2018: date(2018, 6, 14),
    2022: date(2022, 11, 20),
}

# The CSV's `team_short` matches Sofascore's `nameCode` for every team seen across
# the 2010-2022 knockout corpus except Algeria (CSV uses "ALG", Sofascore uses the
# ISO code "DZA") -- confirmed by diffing the full set of 32 teams that actually
# appear in `historical_matches` against the CSV's `team_short` column.
FIFA_TEAM_CODE_ALIASES = {
    "ALG": "DZA",
}


class FifaRankingTransformations:
    """
    Transformation layer producing one `fifa_ranking_snapshot` row per (team, tournament)
    -- the nearest published FIFA ranking on or before that tournament's opening match.
    """

    def transform_historical_rankings(self, csv_text: str) -> list[dict]:
        logger.info({"message": "Starting FIFA ranking transformation"})

        df = pd.read_csv(io.StringIO(csv_text))
        df["date"] = pd.to_datetime(df["date"]).dt.date

        available_dates = sorted(df["date"].unique())
        rows = []
        for tournament_year, start_date in TOURNAMENT_START_DATES.items():
            prior_dates = [d for d in available_dates if d <= start_date]
            if not prior_dates:
                logger.warning({
                    "message": "No FIFA ranking snapshot available on or before tournament start",
                    "tournament_year": tournament_year,
                    "start_date": start_date.isoformat(),
                })
                continue

            snapshot_date = max(prior_dates)
            snapshot = df[df["date"] == snapshot_date]
            logger.info({
                "message": "Resolved FIFA ranking snapshot for tournament",
                "tournament_year": tournament_year,
                "start_date": start_date.isoformat(),
                "snapshot_date": snapshot_date.isoformat(),
                "team_count": len(snapshot),
            })

            ranked = snapshot.sort_values("total_points", ascending=False)
            ranked = ranked.assign(rank=ranked["total_points"].rank(ascending=False, method="min").astype(int))

            for _, row in ranked.iterrows():
                team_code = row.get("team_short")
                if not team_code or pd.isna(team_code):
                    continue
                team_code = FIFA_TEAM_CODE_ALIASES.get(team_code, team_code)
                rows.append({
                    "team_code": team_code,
                    "team_name_raw": row.get("team"),
                    "as_of_date": snapshot_date,
                    "rank": int(row["rank"]),
                    "points": float(row["total_points"]),
                })

        logger.info({"message": "Completed FIFA ranking transformation", "row_count": len(rows)})
        return rows
