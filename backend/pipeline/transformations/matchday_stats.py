import logging
import re
from typing import Any

from db.models.matchday_stats import MATCHDAY_STATS_DEFAULT_STATISTICS

logger = logging.getLogger(__name__)

_CAMEL_CASE_PATTERN = re.compile(r"(?<!^)(?=[A-Z])")
_INTEGER_PATTERN = re.compile(r"^-?\d+$")
_FLOAT_PATTERN = re.compile(r"^-?\d+\.\d+$")
_SKIPPED_STATISTICS_KEYS = {"statisticsType", "ratingVersions"}


def _to_snake_case(value: str) -> str:
    logger.debug({"message": "Converting matchday stats key to snake case", "value": value})
    if not value:
        return value
    if "_" in value:
        return value.lower()
    return _CAMEL_CASE_PATTERN.sub("_", value).lower()


def _coerce_numeric_scalar(value: Any, field_name: str) -> Any:
    logger.debug(
        {
            "message": "Coercing matchday stats scalar",
            "field_name": field_name,
            "value": value,
        }
    )
    if isinstance(value, (int, float)) or value is None:
        return value

    if isinstance(value, str):
        stripped = value.strip()
        if _INTEGER_PATTERN.fullmatch(stripped):
            return int(stripped)
        if _FLOAT_PATTERN.fullmatch(stripped):
            return float(stripped)

    return value


def _normalize_statistics_payload(payload: dict[str, Any]) -> dict[str, Any]:
    logger.info(
        {
            "message": "Normalizing matchday stats payload",
            "keys": sorted(payload.keys()),
        }
    )
    normalized_payload: dict[str, Any] = {}

    for raw_key, raw_value in payload.items():
        if raw_key in _SKIPPED_STATISTICS_KEYS:
            logger.info(
                {
                    "message": "Skipping nested matchday stats metadata",
                    "field_name": raw_key,
                }
            )
            continue

        normalized_key = _to_snake_case(raw_key)
        if normalized_key in {"statistics_type", "rating_versions"}:
            logger.info(
                {
                    "message": "Skipping normalized matchday stats metadata",
                    "field_name": normalized_key,
                }
            )
            continue

        if isinstance(raw_value, dict):
            normalized_value = _normalize_statistics_payload(raw_value)
        elif isinstance(raw_value, list):
            normalized_value = [
                _normalize_statistics_payload(item) if isinstance(item, dict) else _coerce_numeric_scalar(item, normalized_key)
                for item in raw_value
            ]
        else:
            normalized_value = _coerce_numeric_scalar(raw_value, normalized_key)

        normalized_payload[normalized_key] = normalized_value

    logger.info(
        {
            "message": "Completed matchday stats payload normalization",
            "count": len(normalized_payload),
            "keys": sorted(normalized_payload.keys()),
        }
    )
    return normalized_payload


def _resolve_goal_contributions(statistics_payload: dict[str, Any]) -> int:
    logger.info(
        {
            "message": "Resolving matchday stats goal contributions",
            "has_goal_assist": "goal_assist" in statistics_payload,
            "has_goals_assists_sum": "goals_assists_sum" in statistics_payload,
        }
    )
    goal_contributions_value = statistics_payload.get("goal_assist")
    if goal_contributions_value is None:
        goal_contributions_value = statistics_payload.get("goals_assists_sum")
    resolved_goal_contributions = int(round(float(_coerce_numeric_scalar(goal_contributions_value, "goal_contributions") or 0)))
    logger.info(
        {
            "message": "Resolved matchday stats goal contributions",
            "goal_contributions": resolved_goal_contributions,
        }
    )
    return resolved_goal_contributions


def _resolve_pass_accuracy(statistics_payload: dict[str, Any]) -> int:
    logger.info(
        {
            "message": "Resolving matchday stats pass accuracy",
            "has_accurate_passes_percentage": "accurate_passes_percentage" in statistics_payload,
            "has_accurate_passes": "accurate_passes" in statistics_payload,
            "has_total_passes": "total_passes" in statistics_payload,
        }
    )
    accuracy_value = _coerce_numeric_scalar(statistics_payload.get("accurate_passes_percentage"), "accurate_passes_percentage")
    if accuracy_value is None:
        accurate_passes = float(_coerce_numeric_scalar(statistics_payload.get("accurate_passes"), "accurate_passes") or 0)
        total_passes = float(_coerce_numeric_scalar(statistics_payload.get("total_passes"), "total_passes") or 0)
        if total_passes > 0:
            accuracy_value = (accurate_passes / total_passes) * 100
        else:
            accuracy_value = 0

    resolved_pass_accuracy = int(round(float(accuracy_value or 0)))
    logger.info(
        {
            "message": "Resolved matchday stats pass accuracy",
            "pass_accuracy": resolved_pass_accuracy,
        }
    )
    return resolved_pass_accuracy


class MatchdayStatsTransformations:
    """
    Transformation layer for matchday player statistics.
    """

    def transform_matchday_stats(self, match_context: dict, home_lineup: dict, away_lineup: dict) -> list[dict]:
        """
        Transform Sofascore lineups into matchday stats rows.

        {
            "statistics": {
                "totalPass": 16,
                "accuratePass": 13,
                "totalLongBalls": 1,
                "accurateLongBalls": 1,
                "accurateOwnHalfPasses": 5,
                "totalOwnHalfPasses": 6,
                "accurateOppositionHalfPasses": 8,
                "totalOppositionHalfPasses": 10,
                "totalCross": 2,
                "accurateCross": 1,
                "aerialLost": 2,
                "aerialWon": 1,
                "duelLost": 3,
                "duelWon": 3,
                "dispossessed": 1,
                "shotOffTarget": 1,
                "totalClearance": 1,
                "outfielderBlock": 1,
                "interceptionWon": 2,
                "ballRecovery": 5,
                "totalTackle": 1,
                "wonTackle": 1,
                "unsuccessfulTouch": 1,
                "wasFouled": 1,
                "minutesPlayed": 55,
                "touches": 30,
                "rating": 7,
                "possessionLostCtrl": 6,
                "expectedGoals": 0.1361,
                "expectedAssists": 0.146383,
                "totalBallCarriesDistance": 33.895988692363,
                "ballCarriesCount": 4,
                "totalProgression": 16.708420493464,
                "bestBallCarryProgression": 14.640937338134,
                "totalProgressiveBallCarriesDistance": 14.71787080389,
                "progressiveBallCarriesCount": 1,
                "keyPass": 1,
                "ratingVersions": {
                    "original": 7,
                    "alternative": 7.1
                },
                "totalShots": 1,
                "shotValueNormalized": -0.31,
                "passValueNormalized": 0.28,
                "dribbleValueNormalized": 0.32,
                "defensiveValueNormalized": 0.14,
                "statisticsType": {
                    "sportSlug": "football",
                    "statisticsType": "player"
                }
            }
        }
        """
        logger.info(
            {
                "message": "Starting matchday stats transformation",
                "match_id": match_context.get("id"),
                "sofascore_id": match_context.get("sofascore_id"),
                "home_team_code": match_context.get("home_team_code"),
                "away_team_code": match_context.get("away_team_code"),
            }
        )

        match_id = match_context.get("sofascore_id")
        if match_id is None:
            logger.warning(
                {
                    "message": "Match context missing sofascore_id during matchday stats transformation",
                    "match_id": match_context.get("id"),
                }
            )

        transformed_rows: list[dict] = []
        seen_player_ids: set[int] = set()

        for side_name, lineup_payload in (("home", home_lineup), ("away", away_lineup)):
            if not lineup_payload:
                logger.warning(
                    {
                        "message": "Skipping empty lineup payload during matchday stats transformation",
                        "side": side_name,
                        "match_id": match_context.get("id"),
                        "sofascore_id": match_context.get("sofascore_id"),
                    }
                )
                continue

            players = lineup_payload.get("players") if isinstance(lineup_payload, dict) else None
            if not isinstance(players, list):
                logger.warning(
                    {
                        "message": "Skipping lineup payload without players list",
                        "side": side_name,
                        "match_id": match_context.get("id"),
                        "sofascore_id": match_context.get("sofascore_id"),
                    }
                )
                continue

            for lineup_item in players:
                if not isinstance(lineup_item, dict):
                    logger.warning(
                        {
                            "message": "Skipping non-dict lineup item during matchday stats transformation",
                            "side": side_name,
                            "match_id": match_context.get("id"),
                            "sofascore_id": match_context.get("sofascore_id"),
                        }
                    )
                    continue

                player_payload = lineup_item.get("player") or {}
                if not isinstance(player_payload, dict):
                    player_payload = {}

                player_id = player_payload.get("id")
                if player_id is None:
                    logger.warning(
                        {
                            "message": "Skipping lineup player without id",
                            "side": side_name,
                            "match_id": match_context.get("id"),
                            "sofascore_id": match_context.get("sofascore_id"),
                        }
                    )
                    continue

                if player_id in seen_player_ids:
                    logger.warning(
                        {
                            "message": "Skipping duplicate player during matchday stats transformation",
                            "player_id": player_id,
                            "side": side_name,
                            "match_id": match_context.get("id"),
                            "sofascore_id": match_context.get("sofascore_id"),
                        }
                    )
                    continue

                statistics_payload = lineup_item.get("statistics") or lineup_item.get("stats") or {}
                if not isinstance(statistics_payload, dict):
                    logger.warning(
                        {
                            "message": "Skipping lineup player with non-dict statistics payload",
                            "player_id": player_id,
                            "side": side_name,
                            "match_id": match_context.get("id"),
                            "sofascore_id": match_context.get("sofascore_id"),
                        }
                    )
                    statistics_payload = {}

                normalized_statistics = _normalize_statistics_payload(statistics_payload)
                field_value = player_payload.get("position")
                logger.info(
                    {
                        "message": "Resolved matchday stats field",
                        "player_id": player_id,
                        "side": side_name,
                        "field": field_value,
                    }
                )

                statistics = dict(MATCHDAY_STATS_DEFAULT_STATISTICS)
                statistics.update(normalized_statistics)
                statistics["field"] = field_value
                statistics["goal_contributions"] = _resolve_goal_contributions(normalized_statistics)
                statistics["pass_accuracy"] = _resolve_pass_accuracy(normalized_statistics)

                transformed_rows.append(
                    {
                        "player_id": player_id,
                        "match_id": match_id,
                        "match_date": match_context.get("match_date") or match_context.get("kickoff_utc"),
                        "statistics": statistics,
                    }
                )
                seen_player_ids.add(player_id)

        transformed_rows = sorted(
            transformed_rows,
            key=lambda row: (row.get("player_id") or 0, row.get("match_id") or 0),
        )
        logger.info(
            {
                "message": "Completed matchday stats transformation",
                "match_id": match_context.get("id"),
                "sofascore_id": match_context.get("sofascore_id"),
                "count": len(transformed_rows),
            }
        )
        return transformed_rows
