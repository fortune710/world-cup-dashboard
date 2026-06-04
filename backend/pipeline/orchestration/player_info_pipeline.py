from datetime import datetime, timedelta
import asyncio
import logging
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.sensors.external_task import ExternalTaskSensor

logger = logging.getLogger(__name__)

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2026, 5, 21),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def fetch_team_to_index(**context):
    logger.info({"message": "Starting team selection for player indexing"})
    from config.db import SessionLocal
    from db.controllers.teams import get_next_team_to_index

    db = SessionLocal()
    try:
        team = get_next_team_to_index(db)
        if not team:
            logger.info({"message": "No teams left to index"})
            return None
        payload = {"code": team.code, "sofascore_id": team.sofascore_id}
        logger.info({
            "message": "Selected team for player indexing",
            "team_code": team.code,
            "sofascore_id": team.sofascore_id,
        })
        return payload
    except Exception as exc:
        logger.error({
            "message": "Failed to select team for player indexing",
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()

def extract_player_info(**context):
    logger.info({"message": "Starting player info extraction"})
    team_data = context['ti'].xcom_pull(task_ids='fetch_team_to_index')
    if not team_data:
        logger.warning({"message": "No team data received from previous task"})
        return None

    team_id = team_data.get('sofascore_id')
    team_code = team_data.get('code')

    if not team_id:
        logger.warning({
            "message": "Skipping player extraction: missing sofascore_id",
            "team_code": team_code
        })
        return None

    logger.info({
        "message": "Indexing players for team",
        "team_code": team_code,
        "sofascore_id": team_id,
    })

    from pipeline.sources.teams import TeamsSource
    from pipeline.sources.stealth_api import StealthSofascoreAPI
    async def run_extract():
        api = StealthSofascoreAPI()
        try:
            teams_source = TeamsSource(api=api)
            squad = await teams_source.get_players(team_id)
            return squad
        finally:
            await api.close()

    try:
        squad = asyncio.run(run_extract())
        logger.info({
            "message": "Successfully extracted player info",
            "team_code": team_code,
            "count": len(squad or []),
        })
        return {"team_code": team_code, "squad": squad}
    except Exception as exc:
        logger.error({
            "message": "Failed to extract player info",
            "team_code": team_code,
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise

def transform_player_info(**context):
    logger.info({"message": "Starting player info transformation"})
    extract_data = context['ti'].xcom_pull(task_ids='extract_player_info')
    if not extract_data:
        logger.warning({"message": "No player data received from extract task"})
        return None

    team_code = extract_data['team_code']
    squad = extract_data.get('squad') or []
    from pipeline.transformations.teams import TeamsTransformations
    transformations = TeamsTransformations()

    transformed_players = []
    for player_raw in squad:
        try:
            transformed = transformations.transform_squad_player(player_raw, team_code)
            transformed_players.append(transformed)
        except Exception as e:
            logger.warning({
                "message": "Error transforming player data",
                "player_id": player_raw.get("id"),
                "error": {"message": str(e), "type": type(e).__name__},
            })

    logger.info({
        "message": "Successfully transformed player info",
        "team_code": team_code,
        "count": len(transformed_players),
    })
    return {"team_code": team_code, "players": transformed_players}

def load_player_info(**context):
    logger.info({"message": "Starting player info load"})
    transformed_data = context['ti'].xcom_pull(task_ids='transform_player_info')
    if not transformed_data:
        logger.warning({"message": "No transformed player data to load"})
        return

    team_code = transformed_data['team_code']
    players = transformed_data.get('players') or []

    if not players:
        logger.info({
            "message": "No players available to load",
            "team_code": team_code,
        })
        return

    from config.db import SessionLocal
    from db.controllers.teams import mark_team_as_indexed
    from pipeline.load.players import PlayersLoader

    loader = PlayersLoader()
    db = SessionLocal()
    try:
        loader.load_players(players)
        mark_team_as_indexed(db, team_code)
        logger.info({
            "message": "Successfully loaded player info and marked team indexed",
            "team_code": team_code,
            "count": len(players),
        })
    except Exception as exc:
        logger.error({
            "message": "Failed to load player info",
            "team_code": team_code,
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        db.close()

with DAG(
    'world_cup_player_info_pipeline',
    default_args=default_args,
    description='ETL pipeline for player details and ratings per team (batched by team)',
    schedule=timedelta(minutes=30), 
    catchup=False
) as dag:

    wait_for_team_details = ExternalTaskSensor(
        task_id='wait_for_team_details_pipeline',
        external_dag_id='world_cup_team_details_pipeline',
        external_task_id='load_team_details',
        allowed_states=['success'],
        check_existence=True,
    )

    task_fetch_team = PythonOperator(
        task_id='fetch_team_to_index',
        python_callable=fetch_team_to_index,
    )

    task_extract = PythonOperator(
        task_id='extract_player_info',
        python_callable=extract_player_info,
    )

    task_transform = PythonOperator(
        task_id='transform_player_info',
        python_callable=transform_player_info,
    )

    task_load = PythonOperator(
        task_id='load_player_info',
        python_callable=load_player_info,
    )

    wait_for_team_details >> task_fetch_team >> task_extract >> task_transform >> task_load
