from celery import Celery

from config.settings import Settings

celery_app = Celery(
    "world_cup_workers",
    broker=Settings.RABBITMQ_URL,
    backend="rpc://",
    include=[
        "services.player_stats_worker",
        "services.matchday_stats_worker",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Celery Beat schedule for the worker pipeline
    beat_schedule={
        "fetch-player-stats-every-3-min": {
            "task": "services.player_stats_worker.run_fetch_stats_batch",
            "schedule": 180.0,
        },
        "run-matchday-stats-every-3-min": {
            "task": "services.matchday_stats_worker.run_matchday_stats_batch",
            "schedule": 180.0,
        },
    },
    # Use separate Celery queue per worker type to avoid cross-consumption
    task_routes={
        "services.player_stats_worker.*": {"queue": "worker_fetch"},
        "services.matchday_stats_worker.*": {"queue": "worker_matchday_stats"},
    },
)
