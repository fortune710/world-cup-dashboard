import logging

from config.db import SessionLocal
from db.controllers.matches import upsert_match

logger = logging.getLogger(__name__)

class MatchesLoader:
    """
    Loader class for World Cup matches data.
    """

    def load_matches(self, transformed_matches):
        """
        Loads match data into the database.
        """
        logger.info({
            "message": "Starting matches loader",
            "match_count": len(transformed_matches or []),
        })
        db = SessionLocal()
        try:
            for match in transformed_matches:
                upsert_match(db, match)
            logger.info({
                "message": "Successfully loaded matches",
                "match_count": len(transformed_matches or []),
            })
        except Exception as e:
            logger.error({
                "message": "Failed to load matches",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()
