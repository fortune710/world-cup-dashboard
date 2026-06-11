import logging

from config.db import SessionLocal
from db.controllers.matches import update_match_sofascore_id

logger = logging.getLogger(__name__)


class MatchIdMappingLoader:
    """
    Loader class for mapping Sofascore fixture ids onto stored matches.
    """

    def load_match_ids(self, resolved_matches):
        logger.info({
            "message": "Starting match id mapping load",
            "count": len(resolved_matches or []),
        })
        db = SessionLocal()
        updated_count = 0
        skipped_count = 0
        try:
            for resolved_match in resolved_matches or []:
                updated_match = update_match_sofascore_id(db, resolved_match)
                if updated_match:
                    updated_count += 1
                else:
                    skipped_count += 1

            logger.info({
                "message": "Completed match id mapping load",
                "updated_count": updated_count,
                "skipped_count": skipped_count,
            })
            return {
                "updated": updated_count,
                "skipped": skipped_count,
            }
        except Exception as exc:
            logger.error({
                "message": "Failed to load match id mappings",
                "error": {"message": str(exc), "type": type(exc).__name__},
                "count": len(resolved_matches or []),
            })
            raise
        finally:
            db.close()
