"""
Player DB Update Worker
-----------------------
Celery task scheduled via Beat (every 3 min).

Reads pre-transformed player stats from 'player_stats_db_updates' and
writes them to the PostgreSQL players table. Acks only on successful commit.
"""
import logging
import json
from services.celery_app import celery_app
from services.queue_service import QueueService
from config.settings import Settings
from config.db import SessionLocal
from db.controllers.players import update_player_stats

logger = logging.getLogger(__name__)
INBOUND_QUEUE = Settings.PLAYER_STATS_DB_UPDATES_QUEUE
BATCH_SIZE = 20


@celery_app.task(name='services.player_db_update_worker.run_db_update_batch')
def run_db_update_batch() -> dict:
    """
    Celery task: persist a batch of pre-fetched player stats to the database.
    """
    queue = QueueService()
    messages = queue.consume(INBOUND_QUEUE, count=BATCH_SIZE)

    if not messages:
        logger.info(json.dumps({"event": "worker_db_no_messages", "queue_name": INBOUND_QUEUE}))
        queue.close()
        return {'updated': 0}

    db = SessionLocal()
    updated = 0

    try:
        for msg in messages:
            data = msg['body']
            delivery_tag = msg['delivery_tag']
            player_id: int = data.get('player_id')
            player_name: str = data.get('name', 'Unknown')
            rating: float = data.get('rating')
            stats_json: dict = data.get('stats_json')

            logger.info(json.dumps({"event": "worker_db_persisting_player", "player_id": player_id, "player_name": player_name}, default=str))

            try:
                update_player_stats(db, player_id, rating, stats_json)
                queue.ack(delivery_tag)
                updated += 1
                logger.info(json.dumps({"event": "worker_db_updated_player", "player_id": player_id, "player_name": player_name}, default=str))
            except Exception as exc:
                logger.error(json.dumps({"event": "worker_db_error", "player_id": player_id, "error": str(exc)}, default=str))
                logger.exception("worker_db_exception")
                queue.nack(delivery_tag, requeue=True)
    finally:
        db.close()
        queue.close()

    return {'updated': updated}
