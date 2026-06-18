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
from db.models.matches import Match, MatchStatus
from db.controllers.matches import get_matches_for_matchday_stats_queue
from db.controllers.elo import get_elo_inputs
from db.controllers.players import (
    claim_player_stats_queue_pending,
    clear_player_stats_queue_pending,
    get_players_by_team,
    release_player_stats_queue_pending,
)

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
    db = None
    from config.settings import Settings
    from services.queue_service import QueueService

    queue = None
    try:
        db = SessionLocal()
        queue = QueueService()
        settings = Settings()
        matches = get_matches_for_matchday_stats_queue(db)
        if not matches:
            logger.info({"message": "No live or completed matches found in this run"})
            return

        queued_count = 0
        for match in matches:
            match_status = match.status.value if hasattr(match.status, "value") else match.status
            if match_status == MatchStatus.SCHEDULED.value:
                logger.info({
                    "message": "Skipping scheduled match for matchday stats enqueue",
                    "match_id": match.id,
                    "home_team_code": match.home_team_code,
                    "away_team_code": match.away_team_code,
                })
                continue

            if getattr(match, "matchday_stats_indexed", False):
                logger.info({
                    "message": "Skipping match already indexed for matchday stats enqueue",
                    "match_id": match.id,
                    "home_team_code": match.home_team_code,
                    "away_team_code": match.away_team_code,
                })
                continue

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
            db.query(Match).filter(Match.id == match.id).update(
                {Match.matchday_stats_indexed: True},
                synchronize_session=False,
            )
            db.commit()
            logger.info({
                "message": "Marked match as matchday stats indexed",
                "match_id": match.id,
                "home_team_code": match.home_team_code,
                "away_team_code": match.away_team_code,
            })
            queued_count += 1

        logger.info({
            "message": "Completed matchday stats enqueue",
            "queued_count": queued_count,
        })
    except Exception as exc:
        if db is not None:
            db.rollback()
        logger.error({
            "message": "Failed to enqueue matchday stats",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        if db is not None:
            db.close()
        if queue is not None:
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
                "status": match.status.value if hasattr(match.status, "value") else match.status,
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
            "inserted_hiPleasestory_count": inserted_count,
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

    db = None
    queue = None
    completed_matches = []
    teams_to_update = set()
    from config.settings import Settings
    from services.queue_service import QueueService

    try:
        db = SessionLocal()
        for match in transformed_matches:
            if match.get("status") != MatchStatus.COMPLETED.value:
                logger.info({
                    "message": "Skipping non-completed match for player stats enqueue",
                    "match_id": match.get("id"),
                    "status": match.get("status"),
                })
                continue

            match_id = match.get("id")
            if match_id is None:
                logger.warning({
                    "message": "Skipping completed match without id for player stats enqueue",
                    "status": match.get("status"),
                    "home_team_code": match.get("home_team_code"),
                    "away_team_code": match.get("away_team_code"),
                })
                continue

            db_match = db.get(Match, match_id)
            if db_match is None:
                logger.warning({
                    "message": "Skipping completed match missing from database for player stats enqueue",
                    "match_id": match_id,
                    "home_team_code": match.get("home_team_code"),
                    "away_team_code": match.get("away_team_code"),
                })
                continue

            if getattr(db_match, "player_stats_indexed", False):
                logger.info({
                    "message": "Skipping match already indexed for player stats enqueue",
                    "match_id": match_id,
                    "home_team_code": match.get("home_team_code"),
                    "away_team_code": match.get("away_team_code"),
                })
                continue

            completed_matches.append(match)
            home_team_code = match.get("home_team_code")
            away_team_code = match.get("away_team_code")
            if home_team_code:
                teams_to_update.add(home_team_code)
            if away_team_code:
                teams_to_update.add(away_team_code)

            db.query(Match).filter(Match.id == match_id).update(
                {Match.player_stats_indexed: True},
                synchronize_session=False,
            )
            db.commit()
            logger.info({
                "message": "Marked match as player stats indexed",
                "match_id": match_id,
                "home_team_code": home_team_code,
                "away_team_code": away_team_code,
            })

        if not teams_to_update:
            logger.info({"message": "No completed matches found in this run"})
            return

        completed_match_ids = sorted(
            str(match.get("id"))
            for match in completed_matches
            if match.get("id") is not None
        )
        if not completed_match_ids:
            logger.warning({
                "message": "No valid completed match ids found for player stats enqueue",
                "completed_match_count": len(completed_matches),
            })
            return
        batch_key = ",".join(completed_match_ids)

        logger.info({
            "message": "Found teams from completed matches",
            "count": len(teams_to_update),
            "batch_key": batch_key,
        })

        queue = QueueService()
        settings = Settings()
        queued_count = 0
        skipped_pending_count = 0
        for team_code in teams_to_update:
            players = get_players_by_team(db, team_code)
            for player in players:
                claimed = claim_player_stats_queue_pending(db, player.id, batch_key)
                if not claimed:
                    skipped_pending_count += 1
                    logger.info({
                        "message": "Skipping player already pending or already queued for batch",
                        "player_id": player.id,
                        "player_name": player.name,
                        "team_code": team_code,
                        "batch_key": batch_key,
                    })
                    continue

                logger.info({
                    "message": "Enqueueing player for stats update",
                    "player_id": player.id,
                    "player_name": player.name,
                    "team_code": team_code,
                    "batch_key": batch_key,
                })
                try:
                    queue.publish(
                        queue_name=settings.PLAYER_STATS_UPDATES_QUEUE,
                        message={'player_id': player.id, 'name': player.name}
                    )
                    queued_count += 1
                except Exception:
                    release_player_stats_queue_pending(db, player.id, reset_batch_key=True)
                    logger.error({
                        "message": "Failed to publish player stats message; cleared pending flag",
                        "player_id": player.id,
                        "player_name": player.name,
                        "team_code": team_code,
                        "batch_key": batch_key,
                    }, exc_info=True)
                    raise

        logger.info({
            "message": "Completed player stats enqueue",
            "teams": len(teams_to_update),
            "batch_key": batch_key,
            "queued_count": queued_count,
            "skipped_pending_count": skipped_pending_count,
        })
    except Exception as exc:
        if db is not None:
            db.rollback()
        logger.error({
            "message": "Failed to enqueue player stats",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    
    finally:
        if db is not None:
            db.close()
        if queue is not None:
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

    task_extract >> task_transform >> task_load >> task_enqueue_matchday_stats >> task_enqueue >> task_extract_elo >> task_transform_elo >> task_load_elo 
