"""
Player Stats Fetch Worker
-------------------------
Celery task scheduled via Beat (every 3 min).

Reads player IDs from the 'player_stats_updates' queue, calls the Sofascore
API for each, then pushes the result to 'player_stats_db_updates' for the
DB update worker. Acks only on success.
"""
import logging
import json
from services.celery_app import celery_app
from services.queue_service import QueueService
from config.settings import Settings
from pipeline.sources.players import PlayersSource
from pipeline.transformations.players import PlayersTransformations

logger = logging.getLogger(__name__)
INBOUND_QUEUE = Settings.PLAYER_STATS_UPDATES_QUEUE
OUTBOUND_QUEUE = Settings.PLAYER_STATS_DB_UPDATES_QUEUE
BATCH_SIZE = 10


@celery_app.task(name='services.player_stats_worker.run_fetch_stats_batch')
def run_fetch_stats_batch() -> dict:
    """
    Celery task: fetch stats for a batch of players and forward to DB queue.
    """
    queue = QueueService()
    source = PlayersSource()
    transformer = PlayersTransformations()

    messages = queue.consume(INBOUND_QUEUE, count=BATCH_SIZE)

    if not messages:
        logger.info({
            "event": "worker_fetch_no_messages", 
            "queue_name": INBOUND_QUEUE
        })
        queue.close()
        return {'processed': 0}

    processed = 0
    for msg in messages:
        data = msg['body']
        delivery_tag = msg['delivery_tag']
        player_id: int = data.get('player_id')
        player_name: str = data.get('name', 'Unknown')

        logger.info({
            "event": "worker_fetch_processing_player", 
            "player_id": player_id, 
            "player_name": player_name
        })

        try:
            raw_stats = source.get_player_stats(player_id)
            rating, stats_json = transformer.transform_player_stats(raw_stats)

            if rating is not None:
                queue.publish(
                    queue_name=OUTBOUND_QUEUE,
                    message={
                        'player_id': player_id,
                        'name': player_name,
                        'rating': rating,
                        'stats_json': stats_json,
                    },
                )
                logger.info({"event": "worker_fetch_forwarded_player", "player_id": player_id, "player_name": player_name, "queue_name": OUTBOUND_QUEUE})
            else:
                logger.warning({"event": "worker_fetch_missing_stats", "player_id": player_id, "player_name": player_name})

            queue.ack(delivery_tag)
            processed += 1
        except Exception as exc:
            logger.error({"event": "worker_fetch_error", "player_id": player_id, "error": str(exc)})
            logger.exception("worker_fetch_exception")
            queue.nack(delivery_tag, requeue=True)

    queue.close()
    return {'processed': processed}
