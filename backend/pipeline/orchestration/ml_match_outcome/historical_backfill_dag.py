"""
One-off historical World Cup knockout backfill (2010-2022) for the match-outcome
training set. `schedule=None` -- triggered manually, not on the recurring cadence
used by `world_cup_matches_pipeline`.

Important: `build_training_examples` (the last task) only reflects whatever Sofascore
detail has been fetched by the time it runs. `enqueue_historical_match_detail`
publishes fetch jobs to a queue that `services.historical_match_detail_worker`
drains asynchronously via Celery Beat (same fire-and-forget pattern as
`enqueue_matchday_stats` in `matches_pipeline.py`) -- it does not block until the
queue is empty. On a full run, expect `build_training_examples` to complete with
mostly-null xG/h2h/rating features the first time through. Once
`HistoricalMatch.detail_indexed` is `True` for every row (check via the Airflow UI
or a query), manually re-run just the `build_training_examples` task to materialize
the final `training_examples` table with full feature coverage.
"""
import asyncio
from datetime import datetime, timedelta
import logging

from airflow import DAG
from airflow.operators.python import PythonOperator

from config.db import SessionLocal
from config.settings import Settings
from db.controllers.historical_matches import get_historical_matches_pending_detail
from db.controllers.ml_elo import get_ml_elo_inputs, store_ml_elo_history
from pipeline.load.fifa_ranking import FifaRankingLoader
from pipeline.load.historical_matches import HistoricalMatchesLoader
from pipeline.load.training_examples import TrainingExamplesLoader
from pipeline.ml.match_outcome.features.build import build_training_examples
from pipeline.sources.fifa_ranking import FifaRankingSource
from pipeline.sources.historical_matches import HistoricalMatchesSource
from pipeline.transformations.elo import EloTransformations
from pipeline.transformations.fifa_ranking import FifaRankingTransformations
from pipeline.transformations.historical_matches import HistoricalMatchesTransformations

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

TOURNAMENT_SEASONS = [
    (2010, Settings.WC_SEASON_ID_2010),
    (2014, Settings.WC_SEASON_ID_2014),
    (2018, Settings.WC_SEASON_ID_2018),
    (2022, Settings.WC_SEASON_ID_2022),
]


def extract_historical_matches(**context):
    logger.info({"message": "Starting historical matches extraction", "season_count": len(TOURNAMENT_SEASONS)})

    async def _extract_all():
        source = HistoricalMatchesSource()
        results = []
        for tournament_year, season_id in TOURNAMENT_SEASONS:
            raw_matches = await source.get_knockout_matches(season_id)
            results.append({
                "tournament_year": tournament_year,
                "season_id": season_id,
                "raw_matches": raw_matches,
            })
        return results

    try:
        results = asyncio.run(_extract_all())
        logger.info({
            "message": "Successfully extracted historical matches",
            "season_count": len(results),
            "match_count": sum(len(r["raw_matches"]) for r in results),
        })
        return results
    except Exception as exc:
        logger.error({
            "message": "Failed to extract historical matches",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def transform_historical_matches(**context):
    logger.info({"message": "Starting historical matches transformation"})
    raw_by_season = context['ti'].xcom_pull(task_ids='extract_historical_matches')
    if not raw_by_season:
        logger.warning({"message": "No raw historical matches data found for transformation"})
        return []

    transform = HistoricalMatchesTransformations()
    try:
        transformed = []
        for entry in raw_by_season:
            transformed.extend(
                transform.transform_historical_match_data(
                    entry["raw_matches"], entry["tournament_year"], entry["season_id"]
                )
            )
        logger.info({"message": "Successfully transformed historical matches", "count": len(transformed)})
        return transformed
    except Exception as exc:
        logger.error({
            "message": "Failed to transform historical matches",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def load_historical_matches(**context):
    logger.info({"message": "Starting historical matches load"})
    transformed = context['ti'].xcom_pull(task_ids='transform_historical_matches')
    if not transformed:
        logger.warning({"message": "No transformed historical matches found for loading"})
        return
    try:
        HistoricalMatchesLoader().load_historical_matches(transformed)
        logger.info({"message": "Successfully loaded historical matches", "count": len(transformed)})
    except Exception as exc:
        logger.error({
            "message": "Failed to load historical matches",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def load_fifa_rankings(**context):
    logger.info({"message": "Starting FIFA ranking load"})
    try:
        csv_text = FifaRankingSource().get_historical_rankings_csv()
        rows = FifaRankingTransformations().transform_historical_rankings(csv_text)
        FifaRankingLoader().load_fifa_rankings(rows)
        logger.info({"message": "Successfully loaded FIFA rankings", "count": len(rows)})
    except Exception as exc:
        logger.error({
            "message": "Failed to load FIFA rankings",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise


def replay_elo(**context):
    logger.info({"message": "Starting ML Elo replay"})
    db = SessionLocal()
    try:
        inputs = get_ml_elo_inputs(db)
        result = EloTransformations().calculate_ratings([], inputs["matches"])
        count = store_ml_elo_history(db, result["history"], inputs["match_dates"])
        logger.info({"message": "Successfully completed ML Elo replay", "history_count": count})
    except Exception as exc:
        logger.error({
            "message": "Failed to complete ML Elo replay",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()


def enqueue_historical_match_detail(**context):
    logger.info({"message": "Starting historical match detail enqueue"})
    from services.queue_service import QueueService

    db = SessionLocal()
    queue = None
    try:
        queue = QueueService()
        matches = get_historical_matches_pending_detail(db)
        for match in matches:
            queue.publish(
                queue_name=Settings.HISTORICAL_MATCH_DETAIL_QUEUE,
                message={"historical_match_id": match.id, "sofascore_id": match.sofascore_id},
            )
        logger.info({"message": "Completed historical match detail enqueue", "queued_count": len(matches)})
    except Exception as exc:
        logger.error({
            "message": "Failed to enqueue historical match detail",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()
        if queue is not None:
            queue.close()


def build_and_load_training_examples(**context):
    logger.info({"message": "Starting training examples build"})
    db = SessionLocal()
    try:
        examples = build_training_examples(db)
        TrainingExamplesLoader().load_training_examples(examples)
        logger.info({"message": "Successfully built training examples", "count": len(examples)})
    except Exception as exc:
        logger.error({
            "message": "Failed to build training examples",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()


with DAG(
    'ml_historical_backfill',
    default_args=default_args,
    description='One-off historical World Cup knockout backfill for the match-outcome training set',
    schedule=None,
    catchup=False,
) as dag:

    task_extract = PythonOperator(
        task_id='extract_historical_matches',
        python_callable=extract_historical_matches,
    )

    task_transform = PythonOperator(
        task_id='transform_historical_matches',
        python_callable=transform_historical_matches,
    )

    task_load = PythonOperator(
        task_id='load_historical_matches',
        python_callable=load_historical_matches,
    )

    task_fifa = PythonOperator(
        task_id='load_fifa_rankings',
        python_callable=load_fifa_rankings,
    )

    task_elo = PythonOperator(
        task_id='replay_elo',
        python_callable=replay_elo,
    )

    task_enqueue = PythonOperator(
        task_id='enqueue_historical_match_detail',
        python_callable=enqueue_historical_match_detail,
    )

    task_build = PythonOperator(
        task_id='build_training_examples',
        python_callable=build_and_load_training_examples,
    )

    task_extract >> task_transform >> task_load >> task_fifa >> task_elo >> task_enqueue >> task_build
