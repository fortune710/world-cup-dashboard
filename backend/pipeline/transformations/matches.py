import logging

logger = logging.getLogger(__name__)


def _normalize_match_status(raw_status):
    logger.info({
        "message": "Normalizing match status",
        "raw_status": raw_status,
    })

    status_value = raw_status
    if isinstance(raw_status, dict):
        status_value = raw_status.get("type") or raw_status.get("status") or raw_status.get("value")

    status_text = str(status_value or "").strip().lower()
    if not status_text:
        logger.warning({
            "message": "Missing match status; defaulting to scheduled",
            "raw_status": raw_status,
        })
        return "scheduled"

    if any(token in status_text for token in ("live", "progress", "ongoing", "halftime", "half time")):
        return "live"

    if any(token in status_text for token in ("completed", "finished", "full time", "ft", "ended", "final")):
        return "completed"

    return "scheduled"


class MatchesTransformations:
    """
    Transformation layer for World Cup matches data.
    """

    def transform_match_data(self, matches):
        """
        Transforms match data from API format to DB format.
        - Maps group_name to group
        - Removes fields deprecated in the DB schema
        """
        transformed_matches = []
        for match in matches:
            transformed_matches.append({
                "id": match.get("id"),
                "round": match.get("round"),
                "group": match.get("group_name"),
                "home_team_code": match.get("home_team_code"),
                "away_team_code": match.get("away_team_code"),
                "stadium": match.get("stadium"),
                "kickoff_utc": match.get("kickoff_utc"),
                "status": _normalize_match_status(match.get("status")),
                "phase": match.get("phase"),
                "home_score": match.get("home_score", 0),
                "away_score": match.get("away_score", 0),
                "home_pen": match.get("home_pen"),
                "away_pen": match.get("away_pen")
            })
        return transformed_matches
