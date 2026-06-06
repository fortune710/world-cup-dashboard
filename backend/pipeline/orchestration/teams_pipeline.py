from datetime import datetime, timedelta
import logging
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

def extract_teams(**context):
    logger.info({"message": "Starting teams extraction"})
    from pipeline.sources.teams import TeamsSource

    source = TeamsSource()
    try:
        teams = source.get_teams()
        flag_codes = source.get_flagpedia_codes()
        logger.info({
            "message": "Successfully extracted teams and flag codes",
            "teams_count": len(teams),
            "flag_codes_count": len(flag_codes)
        })
        return {"teams": teams, "flag_codes": flag_codes}
    except Exception as e:
        logger.error({
            "message": "Failed to extract teams", 
            "error": {"message": str(e), "type": type(e).__name__}
        })
        raise

def transform_teams(**context):
    logger.info({"message": "Starting teams transformation"})
    extract_data = context['ti'].xcom_pull(task_ids='extract_teams')
    if not extract_data:
        logger.warning({"message": "No raw teams data found for transformation", "count": 0})
        return []

    if isinstance(extract_data, list):
        raw_teams = extract_data
        flag_codes = {}
    else:
        raw_teams = extract_data.get("teams", [])
        flag_codes = extract_data.get("flag_codes", {})

    from pipeline.transformations.teams import TeamsTransformations
    transform = TeamsTransformations()
    try:
        transformed_teams = transform.transform_team_data(raw_teams, flag_codes)
        logger.info({"message": "Successfully transformed teams", "count": len(transformed_teams)})
        return transformed_teams
    except Exception as e:
        logger.error({
            "message": "Failed to transform teams", 
            "error": {"message": str(e), "type": type(e).__name__}
        })
        raise

def load_teams(**context):
    logger.info({"message": "Starting teams load"})
    transformed_teams = context['ti'].xcom_pull(task_ids='transform_teams')
    if not transformed_teams:
        logger.warning({"message": "No transformed teams data found for loading", "count": 0})
        return
    
    from pipeline.load.teams import TeamsLoader
    loader = TeamsLoader()
    try:
        loader.load_teams(transformed_teams)
        logger.info({"message": "Successfully loaded teams into the database", "count": len(transformed_teams)})
    except Exception as e:
        logger.error({
            "message": "Failed to load teams", 
            "error": {"message": str(e), "type": type(e).__name__}
        })
        raise

with DAG(
    'world_cup_teams_pipeline',
    default_args=default_args,
    description='ETL pipeline for World Cup teams',
    schedule=timedelta(days=7),
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
