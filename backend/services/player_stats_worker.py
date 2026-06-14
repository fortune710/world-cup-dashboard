"""
Player Stats Fetch Worker
-------------------------
Celery task scheduled via Beat (every 3 min).

Reads player IDs from the 'player_stats_updates' queue, fetches Sofascore
stats for each player, batches the DB write into a single transaction, and
acks messages only after the transaction succeeds.
"""
import asyncio
import logging
import time

from config.db import SessionLocal
from config.settings import Settings
from db.controllers.players import update_player_stats_batch
from pipeline.sources.players import PlayersSource
from pipeline.transformations.players import PlayersTransformations
from services.celery_app import celery_app
from services.queue_service import QueueService

logger = logging.getLogger(__name__)
INBOUND_QUEUE = Settings.PLAYER_STATS_UPDATES_QUEUE
BATCH_SIZE = 10
PLAYER_STATS_FETCH_TIMEOUT_SECONDS = 30
MAX_MESSAGES_PER_RUN = 50
MAX_RUN_SECONDS = 150


@celery_app.task(name='services.player_stats_worker.run_fetch_stats_batch')
def run_fetch_stats_batch() -> dict:
    """
    Celery task: fetch stats for a batch of players and persist them in one transaction.
    """
    inbound_queue = QueueService()
    transformer = PlayersTransformations()
    db = SessionLocal()

    logger.info({
        "event": "worker_fetch_batch_start",
        "queue_name": INBOUND_QUEUE,
        "batch_size": BATCH_SIZE,
        "max_messages_per_run": MAX_MESSAGES_PER_RUN,
        "max_run_seconds": MAX_RUN_SECONDS,
    })

    try:
        run_started_at = time.monotonic()
        processed_total = 0
        updated_total = 0
        released_total = 0
        retried_total = 0
        batch_number = 0

        while processed_total < MAX_MESSAGES_PER_RUN:
            elapsed_seconds = time.monotonic() - run_started_at
            if elapsed_seconds >= MAX_RUN_SECONDS:
                logger.info({
                    "event": "worker_fetch_run_time_budget_exhausted",
                    "queue_name": INBOUND_QUEUE,
                    "elapsed_seconds": round(elapsed_seconds, 2),
                    "processed_total": processed_total,
                })
                break

            remaining_budget = MAX_MESSAGES_PER_RUN - processed_total
            consume_count = min(BATCH_SIZE, remaining_budget)
            messages = inbound_queue.consume(INBOUND_QUEUE, count=consume_count)
            if not messages:
                logger.info({
                    "event": "worker_fetch_no_messages",
                    "queue_name": INBOUND_QUEUE,
                    "processed_total": processed_total,
                })
                break

            batch_number += 1
            logger.info({
                "event": "worker_fetch_processing_batch",
                "batch_number": batch_number,
                "message_count": len(messages),
                "queue_name": INBOUND_QUEUE,
            })

            player_stats_updates: list[dict] = []
            release_player_ids: list[int] = []
            retry_delivery_tags: list[int] = []
            ack_delivery_tags: list[int] = []

            for msg in messages:
                data = msg["body"]
                delivery_tag = msg["delivery_tag"]
                player_id: int = data.get("player_id")
                player_name: str = data.get("name", "Unknown")

                logger.info({
                    "event": "worker_fetch_processing_player",
                    "player_id": player_id,
                    "player_name": player_name,
                })

                source = PlayersSource()
                try:
                    logger.info({
                        "event": "worker_fetch_player_stats_request_started",
                        "player_id": player_id,
                        "player_name": player_name,
                        "timeout_seconds": PLAYER_STATS_FETCH_TIMEOUT_SECONDS,
                    })
                    raw_stats = asyncio.run(
                        asyncio.wait_for(
                            source.get_player_stats(player_id),
                            timeout=PLAYER_STATS_FETCH_TIMEOUT_SECONDS,
                        )
                    )
                    logger.info({
                        "event": "worker_fetch_player_stats_request_completed",
                        "player_id": player_id,
                        "player_name": player_name,
                    })
                    rating, stats_json = transformer.transform_player_stats(raw_stats)

                    if rating is None:
                        release_player_ids.append(player_id)
                        ack_delivery_tags.append(delivery_tag)
                        logger.warning({
                            "event": "worker_fetch_missing_stats_no_statistics_block",
                            "player_id": player_id,
                            "player_name": player_name,
                            "reason": "statistics_block_missing_or_empty",
                        })
                        continue

                    player_stats_updates.append(
                        {
                            "player_id": player_id,
                            "rating": rating,
                            "stats_json": stats_json,
                        }
                    )
                    ack_delivery_tags.append(delivery_tag)
                    logger.info({
                        "event": "worker_fetch_prepared_player_update",
                        "player_id": player_id,
                        "player_name": player_name,
                        "rating": rating,
                    })
                except TimeoutError as exc:
                    retry_delivery_tags.append(delivery_tag)
                    logger.warning({
                        "event": "worker_fetch_player_stats_timeout_requeue",
                        "player_id": player_id,
                        "player_name": player_name,
                        "timeout_seconds": PLAYER_STATS_FETCH_TIMEOUT_SECONDS,
                        "error": {
                            "message": str(exc),
                            "type": type(exc).__name__,
                        },
                    })
                    continue
                except Exception as exc:
                    error_message = str(exc)
                    if ": 404" in error_message:
                        release_player_ids.append(player_id)
                        ack_delivery_tags.append(delivery_tag)
                        logger.warning({
                            "event": "worker_fetch_sofascore_404_not_retryable",
                            "player_id": player_id,
                            "player_name": player_name,
                            "reason": "sofascore_player_stats_not_found",
                            "error": {
                                "message": error_message,
                                "type": type(exc).__name__,
                            },
                        })
                        continue

                    retry_delivery_tags.append(delivery_tag)
                    logger.error({
                        "event": "worker_fetch_error",
                        "player_id": player_id,
                        "player_name": player_name,
                        "error": {
                            "message": error_message,
                            "type": type(exc).__name__,
                        },
                    }, exc_info=True)
                finally:
                    try:
                        logger.info({
                            "event": "worker_fetch_source_session_close_started",
                            "player_id": player_id,
                            "player_name": player_name,
                        })
                        asyncio.run(asyncio.wait_for(source.api.close(), timeout=10))
                        logger.info({
                            "event": "worker_fetch_source_session_close_succeeded",
                            "player_id": player_id,
                            "player_name": player_name,
                        })
                    except Exception as close_exc:
                        logger.warning({
                            "event": "worker_fetch_source_session_close_failed",
                            "player_id": player_id,
                            "player_name": player_name,
                            "error": {
                                "message": str(close_exc),
                                "type": type(close_exc).__name__,
                            },
                        })

            if not player_stats_updates and not release_player_ids and not retry_delivery_tags:
                logger.info({
                    "event": "worker_fetch_no_db_changes",
                    "queue_name": INBOUND_QUEUE,
                    "batch_number": batch_number,
                })
                break

            batch_result = {"updated_count": 0, "released_count": 0}
            if player_stats_updates or release_player_ids:
                try:
                    batch_result = update_player_stats_batch(
                        db,
                        player_stats_updates,
                        release_player_ids=release_player_ids,
                    )
                except Exception as exc:
                    logger.error({
                        "event": "worker_fetch_db_batch_failed",
                        "error": {
                            "message": str(exc),
                            "type": type(exc).__name__,
                        },
                        "update_count": len(player_stats_updates),
                        "release_count": len(release_player_ids),
                        "retry_count": len(retry_delivery_tags),
                        "batch_number": batch_number,
                    }, exc_info=True)
                    for delivery_tag in ack_delivery_tags:
                        inbound_queue.nack(delivery_tag, requeue=True)
                    for delivery_tag in retry_delivery_tags:
                        inbound_queue.nack(delivery_tag, requeue=True)
                    raise

            for delivery_tag in ack_delivery_tags:
                inbound_queue.ack(delivery_tag)

            for delivery_tag in retry_delivery_tags:
                inbound_queue.nack(delivery_tag, requeue=True)

            batch_processed = len(ack_delivery_tags) + len(retry_delivery_tags)
            processed_total += batch_processed
            updated_total += batch_result.get("updated_count", len(player_stats_updates))
            released_total += batch_result.get("released_count", len(release_player_ids))
            retried_total += len(retry_delivery_tags)

            logger.info({
                "event": "worker_fetch_batch_completed",
                "batch_number": batch_number,
                "processed": batch_processed,
                "updated": batch_result.get("updated_count", len(player_stats_updates)),
                "released": batch_result.get("released_count", len(release_player_ids)),
                "retried": len(retry_delivery_tags),
                "processed_total": processed_total,
                "updated_total": updated_total,
                "released_total": released_total,
                "retried_total": retried_total,
            })

            if batch_processed == 0:
                logger.info({
                    "event": "worker_fetch_batch_no_ackable_messages",
                    "batch_number": batch_number,
                    "queue_name": INBOUND_QUEUE,
                })
                break

        result = {
            "processed": processed_total,
            "updated": updated_total,
            "released": released_total,
            "retried": retried_total,
        }
        logger.info({
            "event": "worker_fetch_run_completed",
            **result,
        })
        return result
    finally:
        db.close()
        inbound_queue.close()
