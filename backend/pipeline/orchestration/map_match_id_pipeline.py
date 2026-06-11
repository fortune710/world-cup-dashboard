from datetime import datetime, timedelta, timezone
import asyncio
import logging

from airflow import DAG
from airflow.operators.python import PythonOperator

from config.db import SessionLocal
from config.settings import Settings
from db.controllers.teams import get_all_teams
from pipeline.load.match_id_mapping import MatchIdMappingLoader

logger = logging.getLogger(__name__)

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "start_date": datetime(2026, 1, 1),
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}


def extract_teams(**context):
    logger.info({"message": "Starting match id mapping team extraction"})
    db = SessionLocal()
    try:
        teams = get_all_teams(db)
        extracted_teams = sorted(
            [
                {
                    "name": team.name,
                    "code": team.code,
                    "sofascore_id": getattr(team, "sofascore_id", None),
                }
                for team in teams
            ],
            key=lambda team: (team.get("code") or "", team.get("name") or ""),
        )
        logger.info({
            "message": "Successfully extracted teams for match id mapping",
            "count": len(extracted_teams),
        })
        return extracted_teams
    except Exception as exc:
        logger.error({
            "message": "Failed to extract teams for match id mapping",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()


async def fetch_2026_wc_fixtures():
    ## Move this into separate source class
    logger.info({"message": "Starting Sofascore fixture extraction for match id mapping"})
    from pipeline.sources.stealth_api import StealthSofascoreAPI
    from sofascore_wrapper.league import League

    settings = Settings()
    api = StealthSofascoreAPI()
    try:
        league = League(api, league_id=settings.WC_LEAGUE_ID)
        rounds_payload = await league.rounds(settings.WC_SEASON_ID_2026)
        round_numbers = sorted(
            {
                round_entry.get("round")
                for round_entry in rounds_payload.get("rounds", [])
                if round_entry.get("round") is not None
            }
        )

        if not round_numbers:
            current_round = await league.current_round(settings.WC_SEASON_ID_2026)
            round_numbers = [current_round] if current_round is not None else []

        fixtures = []
        skipped_rounds = 0
        for round_number in round_numbers:
            try:
                round_payload = await league.league_fixtures_per_round(
                    settings.WC_SEASON_ID_2026,
                    round_number,
                )
            except Exception as exc:
                error_message = str(exc)
                if "404" in error_message:
                    skipped_rounds += 1
                    logger.warning({
                        "message": "Skipping Sofascore round because fixtures are not yet available",
                        "round_number": round_number,
                        "error": {"message": error_message, "type": type(exc).__name__},
                    })
                    continue

                logger.error({
                    "message": "Failed to fetch Sofascore fixtures for round",
                    "round_number": round_number,
                    "error": {"message": error_message, "type": type(exc).__name__},
                })
                raise

            fixtures.extend(round_payload.get("events", []))

        fixtures = sorted(
            fixtures,
            key=lambda fixture: (
                fixture.get("startTimestamp") or 0,
                fixture.get("id") or 0,
            ),
        )
        logger.info({
            "message": "Successfully extracted Sofascore fixtures for match id mapping",
            "rounds_count": len(round_numbers),
            "skipped_rounds": skipped_rounds,
            "fixtures_count": len(fixtures),
        })
        return fixtures
    except Exception as exc:
        logger.error({
            "message": "Failed to extract Sofascore fixtures for match id mapping",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        await api.close()


def extract_fixtures(**context):
    logger.info({"message": "Starting match id mapping fixture extraction"})
    try:
        fixtures = asyncio.run(fetch_2026_wc_fixtures())
        logger.info({
            "message": "Finished match id mapping fixture extraction",
            "count": len(fixtures),
        })
        return fixtures
    except Exception as exc:
        logger.error({
            "message": "Failed to extract fixtures for match id mapping",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def transform_match_ids(**context):
    logger.info({"message": "Starting match id mapping transformation"})
    teams = context["ti"].xcom_pull(task_ids="extract_teams") or []
    fixtures = context["ti"].xcom_pull(task_ids="extract_fixtures") or []

    if not teams:
        logger.warning({"message": "No teams found for match id mapping transformation", "count": 0})
    if not fixtures:
        logger.warning({"message": "No fixtures found for match id mapping transformation", "count": 0})

    try:
        team_lookup = {
            team.get("sofascore_id"): team.get("code")
            for team in teams
            if team.get("sofascore_id") is not None and team.get("code")
        }

        resolved_updates = []
        seen_sofascore_ids = set()
        for fixture in fixtures:
            sofascore_id = fixture.get("id")
            if sofascore_id in seen_sofascore_ids:
                logger.warning({
                    "message": "Skipping duplicate Sofascore fixture id",
                    "sofascore_id": sofascore_id,
                })
                continue

            home_team = fixture.get("homeTeam") or {}
            away_team = fixture.get("awayTeam") or {}
            home_team_code = team_lookup.get(home_team.get("id"))
            away_team_code = team_lookup.get(away_team.get("id"))

            if not home_team_code or not away_team_code:
                logger.warning({
                    "message": "Skipping fixture because one or both teams could not be resolved",
                    "sofascore_id": sofascore_id,
                    "home_team_sofascore_id": home_team.get("id"),
                    "away_team_sofascore_id": away_team.get("id"),
                    "home_team_code": home_team_code,
                    "away_team_code": away_team_code,
                })
                continue

            start_timestamp = fixture.get("startTimestamp")
            kickoff_utc = (
                datetime.fromtimestamp(start_timestamp, tz=timezone.utc) if start_timestamp else None
            )

            resolved_updates.append({
                "sofascore_id": sofascore_id,
                "home_team_code": home_team_code,
                "away_team_code": away_team_code,
                "round": (fixture.get("roundInfo") or {}).get("round"),
                "kickoff_utc": kickoff_utc,
            })
            seen_sofascore_ids.add(sofascore_id)

        resolved_updates = sorted(
            resolved_updates,
            key=lambda match: (
                match.get("round") or 0,
                match.get("kickoff_utc") or datetime.min,
                match.get("sofascore_id") or 0,
            ),
        )
        logger.info({
            "message": "Successfully transformed match id mappings",
            "count": len(resolved_updates),
        })
        return resolved_updates
    except Exception as exc:
        logger.error({
            "message": "Failed to transform match id mappings",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def load_match_ids(**context):
    logger.info({"message": "Starting match id mapping load task"})
    resolved_matches = context["ti"].xcom_pull(task_ids="transform_match_ids") or []
    loader = MatchIdMappingLoader()
    try:
        result = loader.load_match_ids(resolved_matches)
        logger.info({
            "message": "Successfully loaded match id mappings",
            "count": len(resolved_matches),
            "updated": result.get("updated", 0),
            "skipped": result.get("skipped", 0),
        })
        return result
    except Exception as exc:
        logger.error({
            "message": "Failed to load match id mappings",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


with DAG(
    "world_cup_match_id_mapping_pipeline",
    default_args=default_args,
    description="ETL pipeline for mapping Sofascore fixture ids onto World Cup matches",
    schedule=timedelta(days=1),
    catchup=False,
) as dag:
    task_extract_teams = PythonOperator(
        task_id="extract_teams",
        python_callable=extract_teams,
    )

    task_extract_fixtures = PythonOperator(
        task_id="extract_fixtures",
        python_callable=extract_fixtures,
    )

    task_transform = PythonOperator(
        task_id="transform_match_ids",
        python_callable=transform_match_ids,
    )

    task_load = PythonOperator(
        task_id="load_match_ids",
        python_callable=load_match_ids,
    )

    task_extract_teams >> task_transform
    task_extract_fixtures >> task_transform
    task_transform >> task_load
