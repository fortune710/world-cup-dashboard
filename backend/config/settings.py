import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    WC2026_API_KEY = os.getenv("WC2026_API_KEY")
    RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
    PLAYER_STATS_UPDATES_QUEUE = os.getenv("PLAYER_STATS_UPDATES_QUEUE", "player_stats_updates")
    PLAYER_STATS_DB_UPDATES_QUEUE = os.getenv("PLAYER_STATS_DB_UPDATES_QUEUE", "player_stats_db_updates")
    MATCHDAY_STATS_QUEUE = os.getenv("MATCHDAY_STATS_QUEUE", "matchday_stats")
    WC_LEAGUE_ID = 16
    WC_SEASON_ID_2022 = 41087
    WC_SEASON_ID_2026 = 58210

    # MLflow (match outcome predictor)
    MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI")
    MLFLOW_EXPERIMENT_NAME = os.getenv("MLFLOW_EXPERIMENT_NAME", "world-cup-match-outcome")
    MLFLOW_MODEL_NAME = os.getenv("MLFLOW_MODEL_NAME", "world-cup-match-outcome-xgb")

    # Proxy Configuration
    PROXY_SERVER = os.getenv("PROXY_SERVER")
    PROXY_USER = os.getenv("PROXY_USER")
    PROXY_PASSWORD = os.getenv("PROXY_PASSWORD")
