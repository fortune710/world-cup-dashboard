import logging

from config.db import SessionLocal
from db.controllers.elo import replace_elo_ratings


logger = logging.getLogger(__name__)


class EloLoader:
    """
    Loader class for team Elo ratings and rating history.
    """

    def load_elo_ratings(self, elo_result: dict) -> int:
        """
        Replaces Elo ratings and history with a fresh recalculation.
        """
        team_ratings = elo_result.get("team_ratings", {})
        history = elo_result.get("history", [])
        logger.info({
            "message": "Starting Elo load",
            "team_rating_count": len(team_ratings),
            "history_count": len(history),
        })

        db = SessionLocal()
        try:
            inserted_count = replace_elo_ratings(db, team_ratings, history)
            logger.info({
                "message": "Successfully loaded Elo ratings",
                "inserted_history_count": inserted_count,
            })
            return inserted_count
        except Exception as e:
            logger.error({
                "message": "Failed to load Elo ratings",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()
