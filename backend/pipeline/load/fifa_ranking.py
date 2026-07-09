import logging

from config.db import SessionLocal
from db.controllers.fifa_ranking import upsert_fifa_ranking_snapshot

logger = logging.getLogger(__name__)


class FifaRankingLoader:
    """
    Loader class for historical FIFA ranking snapshots.
    """

    def load_fifa_rankings(self, transformed_rankings: list[dict]) -> None:
        logger.info({
            "message": "Starting FIFA ranking loader",
            "row_count": len(transformed_rankings or []),
        })
        db = SessionLocal()
        try:
            for row in transformed_rankings:
                upsert_fifa_ranking_snapshot(db, row)
            db.commit()
            logger.info({
                "message": "Successfully loaded FIFA ranking snapshots",
                "row_count": len(transformed_rankings or []),
            })
        except Exception as e:
            db.rollback()
            logger.error({
                "message": "Failed to load FIFA ranking snapshots",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()
