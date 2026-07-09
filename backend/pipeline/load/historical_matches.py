import logging

from config.db import SessionLocal
from db.controllers.historical_matches import upsert_historical_match

logger = logging.getLogger(__name__)


class HistoricalMatchesLoader:
    """
    Loader class for backfilled historical World Cup knockout matches.
    """

    def load_historical_matches(self, transformed_matches: list[dict]) -> None:
        logger.info({
            "message": "Starting historical matches loader",
            "match_count": len(transformed_matches or []),
        })
        db = SessionLocal()
        try:
            for match in transformed_matches:
                upsert_historical_match(db, match)
            logger.info({
                "message": "Successfully loaded historical matches",
                "match_count": len(transformed_matches or []),
            })
        except Exception as e:
            logger.error({
                "message": "Failed to load historical matches",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()
