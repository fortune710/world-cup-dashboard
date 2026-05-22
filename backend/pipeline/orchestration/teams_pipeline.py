from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

from pipeline.sources.teams import TeamsSource
from pipeline.transformations.teams import TeamsTransformations
from pipeline.load.teams import TeamsLoader

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def extract_teams(**context):
    source = TeamsSource()
    teams = source.get_teams()
    return teams

def transform_teams(**context):
    raw_teams = context['ti'].xcom_pull(task_ids='extract_teams')
    transform = TeamsTransformations()
    transformed_teams = transform.transform_team_data(raw_teams)
    return transformed_teams

def load_teams(**context):
    transformed_teams = context['ti'].xcom_pull(task_ids='transform_teams')
    loader = TeamsLoader()
    loader.load_teams(transformed_teams)

with DAG(
    'world_cup_teams_pipeline',
    default_args=default_args,
    description='ETL pipeline for World Cup teams',
    schedule_interval=timedelta(days=1),
    catchup=False
) as dag:

    task_extract = PythonOperator(
        task_id='extract_teams',
        python_callable=extract_teams,
    )

    task_transform = PythonOperator(
        task_id='transform_teams',
        python_callable=transform_teams,
    )

    task_load = PythonOperator(
        task_id='load_teams',
        python_callable=load_teams,
    )

    task_extract >> task_transform >> task_load
