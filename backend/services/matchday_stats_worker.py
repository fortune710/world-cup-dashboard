"""
Matchday Stats Worker
---------------------
Celery task scheduled via Beat.

Consumes match payloads from the matchday_stats queue, fetches the home and away
lineups for each match, transforms player stats, and replaces the stored
matchday_stats rows for that match.
"""
import asyncio
import logging

from services.celery_app import celery_app
from services.queue_service import QueueService
from config.settings import Settings
from config.db import SessionLocal
from db.controllers.matches import get_match_by_sofascore_id
from db.controllers.matchday_stats import replace_matchday_stats_for_match
from db.models.matches import Match
from pipeline.transformations.matchday_stats import MatchdayStatsTransformations

logger = logging.getLogger(__name__)
INBOUND_QUEUE = Settings.MATCHDAY_STATS_QUEUE
BATCH_SIZE = 5


def _normalize_lineup_payload(lineup_payload: dict) -> dict:
    logger.info({"message": "Normalizing lineup payload for matchday stats worker"})
    if not isinstance(lineup_payload, dict):
        return {"players": []}

    if isinstance(lineup_payload.get("players"), list):
        return lineup_payload

    players: list[dict] = []
    starters = lineup_payload.get("starters")
    substitutes = lineup_payload.get("substitutes")
    if isinstance(starters, list):
        players.extend([entry for entry in starters if isinstance(entry, dict)])
    if isinstance(substitutes, list):
        players.extend([entry for entry in substitutes if isinstance(entry, dict)])

    normalized_payload = dict(lineup_payload)
    normalized_payload["players"] = players
    return normalized_payload


async def fetch_match_lineups(sofascore_id: int) -> dict:
    logger.info({
        "message": "Starting Sofascore lineup fetch for matchday stats worker",
        "sofascore_id": sofascore_id,
    })
    from pipeline.sources.stealth_api import StealthSofascoreAPI

    api = StealthSofascoreAPI()
    try:
        raw_lineups = await api._get(f"/event/{sofascore_id}/lineups")
        home_lineup = _normalize_lineup_payload((raw_lineups or {}).get("home") or {})
        away_lineup = _normalize_lineup_payload((raw_lineups or {}).get("away") or {})
        logger.info({
            "message": "Successfully fetched Sofascore lineups for matchday stats worker",
            "sofascore_id": sofascore_id,
            "home_players": len((home_lineup or {}).get("players") or []),
            "away_players": len((away_lineup or {}).get("players") or []),
        })
        return {
            "home": home_lineup or {},
            "away": away_lineup or {},
        }
    except Exception as exc:
        logger.error({
            "message": "Failed to fetch Sofascore lineups for matchday stats worker",
            "sofascore_id": sofascore_id,
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise
    finally:
        await api.close()


@celery_app.task(name="services.matchday_stats_worker.run_matchday_stats_batch")
def run_matchday_stats_batch() -> dict:
    logger.info({"message": "Starting matchday stats worker batch"})
    queue = QueueService()
    messages = queue.consume(INBOUND_QUEUE, count=BATCH_SIZE)

    if not messages:
        logger.info({
            "message": "No matchday stats messages available",
            "queue_name": INBOUND_QUEUE,
        })
        queue.close()
        return {"processed": 0}

    db = SessionLocal()
    transformer = MatchdayStatsTransformations()
    processed = 0

    try:
        for msg in messages:
            data = msg["body"]
            delivery_tag = msg["delivery_tag"]
            sofascore_id = data.get("sofascore_id")
            internal_match_id = data.get("id")

            logger.info({
                "message": "Processing matchday stats queue message",
                "sofascore_id": sofascore_id,
                "match_id": internal_match_id,
                "home_team_code": data.get("home_team_code"),
                "away_team_code": data.get("away_team_code"),
            })

            try:
                if sofascore_id is None and internal_match_id is None:
                    raise ValueError("Queue payload missing both sofascore_id and internal match id")

                db_match = None
                if sofascore_id is not None:
                    db_match = get_match_by_sofascore_id(db, sofascore_id)
                
                if not db_match and internal_match_id is not None:
                    db_match = db.query(Match).filter(Match.id == internal_match_id).first()
                    if db_match:
                        logger.warning({
                            "message": "Resolved match by internal id fallback",
                            "match_id": internal_match_id,
                            "sofascore_id": sofascore_id,
                        })
                        # Update sofascore_id from DB if it was missing in payload
                        if sofascore_id is None:
                            sofascore_id = getattr(db_match, "sofascore_id", None)

                if sofascore_id is None:
                    raise ValueError(f"Could not resolve sofascore_id for match (internal_id={internal_match_id})")

                match_context = {
                    "id": data.get("id") or getattr(db_match, "id", None),
                    "sofascore_id": sofascore_id,
                    "home_team_code": data.get("home_team_code"),
                    "away_team_code": data.get("away_team_code"),
                    "match_date": getattr(db_match, "kickoff_utc", None),
                    "kickoff_utc": getattr(db_match, "kickoff_utc", None),
                }

                lineups = asyncio.run(fetch_match_lineups(sofascore_id))
  
                transformed_rows = transformer.transform_matchday_stats(
                    match_context,
                    lineups.get("home") or {},
                    lineups.get("away") or {},
                )

                if not transformed_rows:
                    raise ValueError(f"No matchday stats rows were produced for sofascore_id={sofascore_id}")

                inserted_count = replace_matchday_stats_for_match(
                    db,
                    sofascore_id,
                    match_context.get("match_date"),
                    transformed_rows,
                )
                queue.ack(delivery_tag)
                processed += 1
                logger.info({
                    "message": "Completed matchday stats queue message",
                    "sofascore_id": sofascore_id,
                    "match_id": internal_match_id,
                    "inserted_count": inserted_count,
                })
            except Exception as exc:
                logger.error({
                    "message": "Failed to process matchday stats queue message",
                    "sofascore_id": sofascore_id,
                    "match_id": internal_match_id,
                    "error": {"message": str(exc), "type": type(exc).__name__},
                })
                queue.nack(delivery_tag, requeue=True)

    finally:
        db.close()
        queue.close()

    logger.info({
        "message": "Completed matchday stats worker batch",
        "processed": processed,
    })
    return {"processed": processed}
