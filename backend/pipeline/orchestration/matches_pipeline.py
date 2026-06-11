from datetime import datetime, timedelta
import logging
from airflow import DAG
from airflow.operators.python import PythonOperator

from pipeline.sources.matches import MatchesSource
from pipeline.transformations.matches import MatchesTransformations
from pipeline.transformations.elo import EloTransformations
from pipeline.load.matches import MatchesLoader
from pipeline.load.elo import EloLoader
from config.db import SessionLocal
from db.controllers.matches import get_matches_for_matchday_stats_queue
from db.controllers.elo import get_elo_inputs
from db.controllers.players import get_players_by_team

logger = logging.getLogger(__name__)

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def extract_matches(**context):
    logger.info({"message": "Starting matches extraction"})
    source = MatchesSource()
    try:
        matches = source.get_matches()
        logger.info({"message": "Successfully extracted matches", "count": len(matches)})
        return matches
    except Exception as exc:
        logger.error({
            "message": "Failed to extract matches",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise

def transform_matches(**context):
    logger.info({"message": "Starting matches transformation"})
    raw_matches = context['ti'].xcom_pull(task_ids='extract_matches')
    if not raw_matches:
        logger.warning({"message": "No raw matches data found for transformation", "count": 0})
        return []
    transform = MatchesTransformations()
    try:
        transformed_matches = transform.transform_match_data(raw_matches)
        logger.info({"message": "Successfully transformed matches", "count": len(transformed_matches)})
        return transformed_matches
    except Exception as exc:
        logger.error({
            "message": "Failed to transform matches",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise

def load_matches(**context):
    logger.info({"message": "Starting matches load"})
    transformed_matches = context['ti'].xcom_pull(task_ids='transform_matches')
    if not transformed_matches:
        logger.warning({"message": "No transformed matches data found for loading", "count": 0})
        return
    loader = MatchesLoader()
    try:
        loader.load_matches(transformed_matches)
        logger.info({"message": "Successfully loaded matches", "count": len(transformed_matches or [])})
    except Exception as exc:
        logger.error({
            "message": "Failed to load matches",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def enqueue_matchday_stats(**context):
    logger.info({"message": "Starting matchday stats enqueue"})
    db = SessionLocal()
    from config.settings import Settings
    from services.queue_service import QueueService

    queue = QueueService()
    settings = Settings()
    try:
        matches = get_matches_for_matchday_stats_queue(db)
        if not matches:
            logger.info({"message": "No live or completed matches found in this run"})
            return

        queued_count = 0
        for match in matches:
            if getattr(match, "sofascore_id", None) is None:
                logger.warning({
                    "message": "Skipping match without sofascore id for matchday stats enqueue",
                    "match_id": match.id,
                    "home_team_code": match.home_team_code,
                    "away_team_code": match.away_team_code,
                })
                continue

            queue.publish(
                queue_name=settings.MATCHDAY_STATS_QUEUE,
                message={
                    "sofascore_id": match.sofascore_id,
                    "id": match.id,
                    "home_team_code": match.home_team_code,
                    "away_team_code": match.away_team_code,
                },
            )
            queued_count += 1

        logger.info({
            "message": "Completed matchday stats enqueue",
            "queued_count": queued_count,
        })
    except Exception as exc:
        logger.error({
            "message": "Failed to enqueue matchday stats",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()
        queue.close()


def extract_elo_inputs(**context):
    logger.info({"message": "Starting Elo input extraction"})
    db = SessionLocal()
    try:
        teams, matches = get_elo_inputs(db)
        team_payloads = [
            {"code": team.code, "elo_rating": team.elo_rating}
            for team in teams
        ]
        match_payloads = [
            {
                "id": match.id,
                "round": match.round,
                "home_team_code": match.home_team_code,
                "away_team_code": match.away_team_code,
                "kickoff_utc": match.kickoff_utc.isoformat() if match.kickoff_utc else None,
                "status": match.status,
                "home_score": match.home_score,
                "away_score": match.away_score,
                "home_pen": match.home_pen,
                "away_pen": match.away_pen,
            }
            for match in matches
        ]
        logger.info({
            "message": "Successfully extracted Elo inputs",
            "team_count": len(team_payloads),
            "completed_match_count": len(match_payloads),
        })
        return {"teams": team_payloads, "matches": match_payloads}
    except Exception as exc:
        logger.error({
            "message": "Failed to extract Elo inputs",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()


def transform_elo_ratings(**context):
    logger.info({"message": "Starting Elo transformation"})
    elo_inputs = context['ti'].xcom_pull(task_ids='extract_elo_inputs')
    if not elo_inputs:
        logger.warning({"message": "No Elo inputs found for transformation"})
        return {"team_ratings": {}, "history": []}
    try:
        transformer = EloTransformations()
        result = transformer.calculate_ratings(
            elo_inputs.get("teams", []),
            elo_inputs.get("matches", []),
        )
        logger.info({
            "message": "Successfully transformed Elo ratings",
            "team_rating_count": len(result.get("team_ratings", {})),
            "history_count": len(result.get("history", [])),
        })
        return result
    except Exception as exc:
        logger.error({
            "message": "Failed to transform Elo ratings",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def load_elo_ratings(**context):
    logger.info({"message": "Starting Elo ratings load task"})
    elo_result = context['ti'].xcom_pull(task_ids='transform_elo_ratings')
    if not elo_result:
        logger.warning({"message": "No Elo ratings data found for loading"})
        return
    try:
        loader = EloLoader()
        inserted_count = loader.load_elo_ratings(elo_result)
        logger.info({
            "message": "Successfully loaded Elo ratings task",
            "inserted_history_count": inserted_count,
        })
    except Exception as exc:
        logger.error({
            "message": "Failed to load Elo ratings task",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def enqueue_player_stats(**context):
    logger.info({"message": "Starting player stats enqueue"})
    transformed_matches = context['ti'].xcom_pull(task_ids='transform_matches')
    if not transformed_matches:
        logger.warning({"message": "No transformed matches found", "count": 0})
        return

    # Identify teams in completed matches
    teams_to_update = set()
    for match in transformed_matches:
        if match.get('status') == 'completed':
            teams_to_update.add(match.get('home_team_code'))
            teams_to_update.add(match.get('away_team_code'))

    if not teams_to_update:
        logger.info({"message": "No completed matches found in this run"})
        return

    logger.info({
        "message": "Found teams from completed matches",
        "count": len(teams_to_update),
    })

    db = SessionLocal()
    from config.settings import Settings
    from services.queue_service import QueueService

    queue = QueueService()
    settings = Settings()
    try:
        for team_code in teams_to_update:
            players = get_players_by_team(db, team_code)
            for player in players:
                queue.publish(
                    queue_name=settings.PLAYER_STATS_UPDATES_QUEUE,
                    message={'player_id': player.id, 'name': player.name}
                )
        logger.info({
            "message": "Completed player stats enqueue",
            "teams": len(teams_to_update),
        })
    except Exception as exc:
        logger.error({
            "message": "Failed to enqueue player stats",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()
        queue.close()

with DAG(
    'world_cup_matches_pipeline',
    default_args=default_args,
    description='ETL pipeline for World Cup matches',
    schedule=timedelta(minutes=30),
    catchup=False
) as dag:

    task_extract = PythonOperator(
        task_id='extract_matches',
        python_callable=extract_matches,
    )

    task_transform = PythonOperator(
        task_id='transform_matches',
        python_callable=transform_matches,
    )

    task_load = PythonOperator(
        task_id='load_matches',
        python_callable=load_matches,
    )

    task_enqueue_matchday_stats = PythonOperator(
        task_id='enqueue_matchday_stats',
        python_callable=enqueue_matchday_stats,
    )
    
    task_extract_elo = PythonOperator(
        task_id='extract_elo_inputs',
        python_callable=extract_elo_inputs,
    )

    task_transform_elo = PythonOperator(
        task_id='transform_elo_ratings',
        python_callable=transform_elo_ratings,
    )

    task_load_elo = PythonOperator(
        task_id='load_elo_ratings',
        python_callable=load_elo_ratings,
    )

    task_enqueue = PythonOperator(
        task_id='enqueue_player_stats',
        python_callable=enqueue_player_stats,
    )

    task_extract >> task_transform >> task_load >> task_enqueue_matchday_stats >> task_extract_elo >> task_transform_elo >> task_load_elo >> task_enqueue
