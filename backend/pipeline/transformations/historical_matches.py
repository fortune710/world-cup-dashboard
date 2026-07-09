import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Confirmed against live Sofascore data for 2010/2014/2018/2022: per-match roundInfo.name
# is stable ("Round of 16", "Quarterfinals", "Semifinals", "Final", "Match for 3rd place").
# EloTransformations.STAGE_WEIGHTS already substring-matches "quarter"/"semi"/"round of 16",
# but "third" is not a substring of "match for 3rd place" -- that one needs an explicit alias.
ROUND_NAME_ALIASES = {
    "match for 3rd place": "third place",
}


class HistoricalMatchesTransformations:
    """
    Transformation layer mapping raw Sofascore event payloads (from
    `HistoricalMatchesSource.get_knockout_matches`) to `HistoricalMatch` columns.
    """

    def transform_historical_match_data(
        self, raw_matches: list[dict], tournament_year: int, season_id: int
    ) -> list[dict]:
        logger.info({
            "message": "Starting historical match transformation",
            "tournament_year": tournament_year,
            "season_id": season_id,
            "raw_count": len(raw_matches or []),
        })

        transformed = []
        for event in raw_matches or []:
            status = event.get("status") or {}
            if status.get("type") != "finished":
                logger.warning({
                    "message": "Skipping non-finished historical event",
                    "event_id": event.get("id"),
                    "status": status,
                })
                continue

            home_team = event.get("homeTeam") or {}
            away_team = event.get("awayTeam") or {}
            home_score = event.get("homeScore") or {}
            away_score = event.get("awayScore") or {}
            round_info = event.get("roundInfo") or {}

            round_name = str(round_info.get("name") or "").strip().lower()
            round_name = ROUND_NAME_ALIASES.get(round_name, round_name)

            start_timestamp = event.get("startTimestamp")
            kickoff_utc = (
                datetime.fromtimestamp(start_timestamp, tz=timezone.utc).replace(tzinfo=None)
                if start_timestamp is not None
                else None
            )

            if not home_team.get("nameCode") or not away_team.get("nameCode") or kickoff_utc is None:
                logger.warning({
                    "message": "Skipping historical event missing required fields",
                    "event_id": event.get("id"),
                    "home_code": home_team.get("nameCode"),
                    "away_code": away_team.get("nameCode"),
                    "has_kickoff": kickoff_utc is not None,
                })
                continue

            transformed.append({
                "tournament_year": tournament_year,
                "season_id": season_id,
                "round": round_name,
                "home_team_code": home_team["nameCode"],
                "away_team_code": away_team["nameCode"],
                "home_team_name": home_team.get("name") or home_team["nameCode"],
                "away_team_name": away_team.get("name") or away_team["nameCode"],
                "kickoff_utc": kickoff_utc,
                "home_score": home_score.get("display", home_score.get("normaltime", 0)) or 0,
                "away_score": away_score.get("display", away_score.get("normaltime", 0)) or 0,
                "home_pen": home_score.get("penalties"),
                "away_pen": away_score.get("penalties"),
                "sofascore_id": event.get("id"),
            })

        logger.info({
            "message": "Completed historical match transformation",
            "tournament_year": tournament_year,
            "season_id": season_id,
            "transformed_count": len(transformed),
        })
        return transformed
