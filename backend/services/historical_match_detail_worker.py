"""
Historical Match Detail Worker
------------------------------
Celery task scheduled via Beat.

Consumes historical match payloads from the historical_match_detail queue, fetches
Sofascore stats/h2h/pre_match_form for each, and stores the combined payload on
`HistoricalMatch.detail_json`. Self-draining like the other workers: idles back to
`{"processed": 0}` once the queue empties, so this can stay registered indefinitely
without harming the recurring pipeline.
"""
import asyncio
import logging

from services.celery_app import celery_app
from services.queue_service import QueueService
from config.settings import Settings
from config.db import SessionLocal
from db.controllers.historical_matches import store_historical_match_detail

logger = logging.getLogger(__name__)
INBOUND_QUEUE = Settings.HISTORICAL_MATCH_DETAIL_QUEUE
BATCH_SIZE = 5


async def fetch_historical_match_detail(sofascore_id: int) -> dict:
    logger.info({
        "message": "Starting Sofascore detail fetch for historical match worker",
        "sofascore_id": sofascore_id,
    })
    from pipeline.sources.historical_match_detail import HistoricalMatchDetailSource

    source = HistoricalMatchDetailSource()
    try:
        detail = await source.get_match_detail(sofascore_id)
        logger.info({
            "message": "Successfully fetched Sofascore detail for historical match worker",
            "sofascore_id": sofascore_id,
        })
        return detail
    finally:
        await source.sofascore_api.close()


@celery_app.task(name="services.historical_match_detail_worker.run_historical_match_detail_batch")
def run_historical_match_detail_batch() -> dict:
    logger.info({"message": "Starting historical match detail worker batch"})
    queue = QueueService()
    messages = queue.consume(INBOUND_QUEUE, count=BATCH_SIZE)

    if not messages:
        logger.info({
            "message": "No historical match detail messages available",
            "queue_name": INBOUND_QUEUE,
        })
        queue.close()
        return {"processed": 0}

    db = SessionLocal()
    processed = 0

    try:
        for msg in messages:
            data = msg["body"]
            delivery_tag = msg["delivery_tag"]
            historical_match_id = data.get("historical_match_id")
            sofascore_id = data.get("sofascore_id")

            logger.info({
                "message": "Processing historical match detail queue message",
                "historical_match_id": historical_match_id,
                "sofascore_id": sofascore_id,
            })

            try:
                if historical_match_id is None or sofascore_id is None:
                    raise ValueError("Queue payload missing historical_match_id or sofascore_id")

                detail = asyncio.run(fetch_historical_match_detail(sofascore_id))
                store_historical_match_detail(db, historical_match_id, detail)
                queue.ack(delivery_tag)
                processed += 1
                logger.info({
                    "message": "Completed historical match detail queue message",
                    "historical_match_id": historical_match_id,
                    "sofascore_id": sofascore_id,
                })
            except Exception as exc:
                logger.error({
                    "message": "Failed to process historical match detail queue message",
                    "historical_match_id": historical_match_id,
                    "sofascore_id": sofascore_id,
                    "error": {"message": str(exc), "type": type(exc).__name__},
                })
                queue.nack(delivery_tag, requeue=True)

    finally:
        db.close()
        queue.close()

    logger.info({
        "message": "Completed historical match detail worker batch",
        "processed": processed,
    })
    return {"processed": processed}
