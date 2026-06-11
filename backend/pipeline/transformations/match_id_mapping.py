import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class MatchIdMappingTransformations:
    """
    Transformation layer for mapping Sofascore fixtures to internal match lookup data.
    """

    def transform_fixtures_to_match_updates(self, teams, matches, fixtures):
        """
        Map Sofascore fixtures to match update payloads using team sofascore_id values.

        Each returned item contains the Sofascore fixture id and the resolved internal match id.
        Fixtures are skipped if either team cannot be resolved from the provided team mapping
        or if no corresponding internal match row can be located.
        """
        team_count = len(teams or [])
        match_count = len(matches or [])
        fixture_count = len(fixtures or [])
        logger.info(
            {
                "message": "Starting transform_fixtures_to_match_updates",
                "teams_count": team_count,
                "matches_count": match_count,
                "fixtures_count": fixture_count,
            }
        )

        team_code_by_sofascore_id = {}
        for team in teams or []:
            if isinstance(team, dict):
                sofascore_id = team.get("sofascore_id")
                code = team.get("code")
                name = team.get("name")
            else:
                sofascore_id = getattr(team, "sofascore_id", None)
                code = getattr(team, "code", None)
                name = getattr(team, "name", None)

            if sofascore_id is None or not code:
                logger.warning(
                    {
                        "message": "Skipping team without sofascore_id or code during fixture mapping",
                        "team_name": name,
                        "sofascore_id": sofascore_id,
                        "code": code,
                    }
                )
                continue

            team_code_by_sofascore_id[sofascore_id] = code

        match_lookup = {}
        for match in matches or []:
            if isinstance(match, dict):
                match_id = match.get("id")
                home_team_code = match.get("home_team_code")
                away_team_code = match.get("away_team_code")
                kickoff_value = match.get("kickoff_utc")
            else:
                match_id = getattr(match, "id", None)
                home_team_code = getattr(match, "home_team_code", None)
                away_team_code = getattr(match, "away_team_code", None)
                kickoff_value = getattr(match, "kickoff_utc", None)

            kickoff_utc = None
            if isinstance(kickoff_value, datetime):
                kickoff_utc = kickoff_value if kickoff_value.tzinfo else kickoff_value.replace(tzinfo=timezone.utc)
            elif isinstance(kickoff_value, (int, float)):
                kickoff_utc = datetime.fromtimestamp(kickoff_value, tz=timezone.utc)
            elif isinstance(kickoff_value, str) and kickoff_value:
                kickoff_utc = datetime.fromisoformat(kickoff_value.replace("Z", "+00:00"))
                if kickoff_utc.tzinfo is None:
                    kickoff_utc = kickoff_utc.replace(tzinfo=timezone.utc)

            if match_id is None or not home_team_code or not away_team_code or kickoff_utc is None:
                logger.warning(
                    {
                        "message": "Skipping match without complete lookup fields during fixture mapping",
                        "match_id": match_id,
                        "home_team_code": home_team_code,
                        "away_team_code": away_team_code,
                        "kickoff_utc": kickoff_utc,
                    }
                )
                continue

            match_lookup[(home_team_code, away_team_code, kickoff_utc)] = match_id

        transformed_fixtures = []
        for fixture in fixtures or []:
            if fixture is None:
                logger.warning({"message": "Skipping missing fixture entry during match mapping"})
                continue

            if isinstance(fixture, dict):
                fixture_id = fixture.get("id")
                home_team = fixture.get("homeTeam") or fixture.get("home_team") or {}
                away_team = fixture.get("awayTeam") or fixture.get("away_team") or {}
                home_team_id = (
                    home_team.get("id")
                    if isinstance(home_team, dict)
                    else getattr(home_team, "id", None)
                )
                away_team_id = (
                    away_team.get("id")
                    if isinstance(away_team, dict)
                    else getattr(away_team, "id", None)
                )
                kickoff_value = (
                    fixture.get("startTimestamp")
                    or fixture.get("kickoffTime")
                    or fixture.get("kickoff_utc")
                    or fixture.get("start_timestamp")
                )
                status = fixture.get("status") or {}
            else:
                fixture_id = getattr(fixture, "id", None)
                home_team = getattr(fixture, "homeTeam", None) or getattr(fixture, "home_team", None)
                away_team = getattr(fixture, "awayTeam", None) or getattr(fixture, "away_team", None)
                home_team_id = getattr(home_team, "id", None) if home_team is not None else None
                away_team_id = getattr(away_team, "id", None) if away_team is not None else None
                kickoff_value = (
                    getattr(fixture, "startTimestamp", None)
                    or getattr(fixture, "kickoffTime", None)
                    or getattr(fixture, "kickoff_utc", None)
                    or getattr(fixture, "start_timestamp", None)
                )
                status = getattr(fixture, "status", None) or {}

            home_team_code = team_code_by_sofascore_id.get(home_team_id)
            away_team_code = team_code_by_sofascore_id.get(away_team_id)

            if not home_team_code or not away_team_code:
                logger.warning(
                    {
                        "message": "Skipping fixture because one or both teams could not be resolved",
                        "fixture_id": fixture_id,
                        "home_team_id": home_team_id,
                        "away_team_id": away_team_id,
                        "home_team_code": home_team_code,
                        "away_team_code": away_team_code,
                    }
                )
                continue

            kickoff_utc = None
            if isinstance(kickoff_value, datetime):
                kickoff_utc = kickoff_value if kickoff_value.tzinfo else kickoff_value.replace(tzinfo=timezone.utc)
            elif isinstance(kickoff_value, (int, float)):
                kickoff_utc = datetime.fromtimestamp(kickoff_value, tz=timezone.utc)
            elif isinstance(kickoff_value, str) and kickoff_value:
                kickoff_utc = datetime.fromisoformat(kickoff_value.replace("Z", "+00:00"))
                if kickoff_utc.tzinfo is None:
                    kickoff_utc = kickoff_utc.replace(tzinfo=timezone.utc)

            if kickoff_utc is None:
                logger.warning(
                    {
                        "message": "Skipping fixture without kickoff timestamp",
                        "fixture_id": fixture_id,
                        "home_team_code": home_team_code,
                        "away_team_code": away_team_code,
                    }
                )
                continue

            match_id = match_lookup.get((home_team_code, away_team_code, kickoff_utc))
            if match_id is None:
                logger.warning(
                    {
                        "message": "Skipping fixture because no internal match row matched the lookup key",
                        "fixture_id": fixture_id,
                        "home_team_code": home_team_code,
                        "away_team_code": away_team_code,
                        "kickoff_utc": kickoff_utc.isoformat(),
                    }
                )
                continue

            transformed_fixtures.append(
                {
                    "sofascore_id": fixture_id,
                    "match_id": match_id,
                    "kickoff_utc": kickoff_utc,
                    "home_team_code": home_team_code,
                    "away_team_code": away_team_code,
                    "fixture_status_type": status.get("type") if isinstance(status, dict) else None,
                    "fixture_status_description": status.get("description") if isinstance(status, dict) else None,
                }
            )

        logger.info(
            {
                "message": "Completed transform_fixtures_to_match_updates",
                "mapped_count": len(transformed_fixtures),
            }
        )
        return transformed_fixtures
