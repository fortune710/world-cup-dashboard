from datetime import datetime, timedelta
import logging
import asyncio
from airflow import DAG
from airflow.operators.python import PythonOperator

# Configure logging
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

def extract_team_details(**context):
    logger.info({"message": "Starting team details extraction"})
    from pipeline.sources.teams import TeamsSource

    source = TeamsSource()
    try:
        teams = asyncio.run(source.get_teams_details())
        logger.info({"message": "Successfully extracted team details", "count": len(teams)})
        return teams
    except Exception as e:
        logger.error({
            "message": "Failed to extract team details", 
            "error": {"message": str(e), "type": type(e).__name__}
        })
        raise

def transform_team_details(**context):
    logger.info({"message": "Starting team details transformation"})
    raw_teams = context['ti'].xcom_pull(task_ids='extract_team_details')
    if not raw_teams:
        logger.warning({"message": "No raw teams data found for transformation", "count": 0})
        return []
    
    from pipeline.transformations.teams import TeamsTransformations
    transform = TeamsTransformations()
    try:
        transformed_teams = transform.transform_team_details(raw_teams)
        logger.info({"message": "Successfully transformed team details", "count": len(transformed_teams)})
        return transformed_teams
    except Exception as e:
        logger.error({
            "message": "Failed to transform team details", 
            "error": {"message": str(e), "type": type(e).__name__}
        })
        raise

def load_team_details(**context):
    logger.info({"message": "Starting team details load"})
    transformed_teams = context['ti'].xcom_pull(task_ids='transform_team_details')
    if not transformed_teams:
        logger.warning({"message": "No transformed teams data found for loading", "count": 0})
        return
    
    from pipeline.load.teams import TeamsLoader
    loader = TeamsLoader()
    try:
        loader.load_teams(transformed_teams)
        logger.info({"message": "Successfully loaded team details entries", "count": len(transformed_teams)})
    except Exception as e:
        logger.error({
            "message": "Failed to load team details", 
            "error": {"message": str(e), "type": type(e).__name__}
        })
        raise

with DAG(
    'world_cup_team_details_pipeline',
    default_args=default_args,
    description='ETL pipeline for World Cup team details (standings)',
    schedule=timedelta(days=1),
    catchup=False
) as dag:

    task_extract = PythonOperator(
        task_id='extract_team_details',
        python_callable=extract_team_details,
    )

    task_transform = PythonOperator(
        task_id='transform_team_details',
        python_callable=transform_team_details,
    )

    task_load = PythonOperator(
        task_id='load_team_details',
        python_callable=load_team_details,
    )

    task_extract >> task_transform >> task_load
