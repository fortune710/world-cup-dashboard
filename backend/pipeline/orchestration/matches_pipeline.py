from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

from pipeline.sources.matches import MatchesSource
from pipeline.transformations.matches import MatchesTransformations
from pipeline.load.matches import MatchesLoader
from config.db import SessionLocal
from db.controllers.players import get_players_by_team
from services.queue_service import QueueService
from config.settings import Settings

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
    source = MatchesSource()
    matches = source.get_matches()
    return matches

def transform_matches(**context):
    raw_matches = context['ti'].xcom_pull(task_ids='extract_matches')
    transform = MatchesTransformations()
    transformed_matches = transform.transform_match_data(raw_matches)
    return transformed_matches

def load_matches(**context):
    transformed_matches = context['ti'].xcom_pull(task_ids='transform_matches')
    loader = MatchesLoader()
    loader.load_matches(transformed_matches)


def enqueue_player_stats(**context):
    transformed_matches = context['ti'].xcom_pull(task_ids='transform_matches')
    if not transformed_matches:
        return

    # Identify teams in completed matches
    teams_to_update = set()
    for match in transformed_matches:
        if match.get('status') == 'completed':
            teams_to_update.add(match.get('home_team_code'))
            teams_to_update.add(match.get('away_team_code'))

    if not teams_to_update:
        print("No completed matches found in this run.")
        return

    print(f"Found {len(teams_to_update)} teams from completed matches. Enqueueing players...")

    db = SessionLocal()
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
    finally:
        db.close()
        queue.close()

with DAG(
    'world_cup_matches_pipeline',
    default_args=default_args,
    description='ETL pipeline for World Cup matches',
    schedule=timedelta(hours=6),
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

    task_enqueue = PythonOperator(
        task_id='enqueue_player_stats',
        python_callable=enqueue_player_stats,
    )

    task_extract >> task_transform >> task_load >> task_enqueue
