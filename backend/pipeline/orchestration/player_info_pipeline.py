from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.sensors.external_task import ExternalTaskSensor
import asyncio

from config.db import SessionLocal
from db.controllers.teams import get_next_team_to_index, mark_team_as_indexed
from sofascore_wrapper.api import SofascoreAPI
from pipeline.sources.teams import TeamsSource
from pipeline.transformations.teams import TeamsTransformations
from pipeline.load.players import PlayersLoader

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
    db = SessionLocal()
    try:
        team = get_next_team_to_index(db)
        if not team:
            print("No teams left to index.")
            return None
        return {"code": team.code, "sofascore_id": team.sofascore_id}
    finally:
        db.close()

def extract_player_info(**context):
    team_data = context['ti'].xcom_pull(task_ids='fetch_team_to_index')
    if not team_data:
        print("No team data received from previous task.")
        return None

    team_id = team_data['sofascore_id']
    team_code = team_data['code']
    print(f"Indexing players for team: {team_code} (ID: {team_id})")

    async def run_extract():
        api = SofascoreAPI()
        try:
            teams_source = TeamsSource(api=api)
            squad = await teams_source.get_players(team_id)
            return squad
        finally:
            await api.close()

    squad = asyncio.run(run_extract())
    return {"team_code": team_code, "squad": squad}

def transform_player_info(**context):
    extract_data = context['ti'].xcom_pull(task_ids='extract_player_info')
    if not extract_data:
        print("No player data received from extract task.")
        return None

    team_code = extract_data['team_code']
    squad = extract_data.get('squad') or []
    transformations = TeamsTransformations()

    transformed_players = []
    for player_raw in squad:
        try:
            transformed = transformations.transform_squad_player(player_raw, team_code)
            transformed_players.append(transformed)
        except Exception as e:
            print(f"Error transforming data for player {player_raw.get('id')}: {e}")

    return {"team_code": team_code, "players": transformed_players}

def load_player_info(**context):
    transformed_data = context['ti'].xcom_pull(task_ids='transform_player_info')
    if not transformed_data:
        print("No transformed player data to load.")
        return

    team_code = transformed_data['team_code']
    players = transformed_data.get('players') or []

    if not players:
        return

    loader = PlayersLoader()
    loader.load_players(players)

    db = SessionLocal()
    try:
        mark_team_as_indexed(db, team_code)
        print(f"Successfully marked team {team_code} as indexed.")
    finally:
        db.close()

with DAG(
    'world_cup_player_info_pipeline',
    default_args=default_args,
    description='ETL pipeline for player details and ratings per team (batched by team)',
    schedule=timedelta(minutes=30), 
    catchup=False
) as dag:

    # wait_for_team_details = ExternalTaskSensor(
    #     task_id='wait_for_team_details_pipeline',
    #     external_dag_id='world_cup_team_details_pipeline',
    #     external_task_id='load_team_details',
    #     allowed_states=['success'],
    #     check_existence=True,
    # )

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

    task_fetch_team >> task_extract >> task_transform >> task_load
