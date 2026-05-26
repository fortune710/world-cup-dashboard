from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

from pipeline.sources.matches import MatchesSource
from pipeline.transformations.matches import MatchesTransformations
from pipeline.load.matches import MatchesLoader

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

    task_extract >> task_transform >> task_load
