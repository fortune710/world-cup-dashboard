import logging

from config.db import SessionLocal
from db.controllers.players import upsert_player, upsert_players

logger = logging.getLogger(__name__)

class PlayersLoader:
    def load_player(self, transformed_player):
        """
        Loads a single transformed player into the database.
        """
        logger.info({
            "message": "Starting single player load",
            "player_id": transformed_player.get("id") if transformed_player else None,
        })
        db = SessionLocal()
        try:
            upsert_player(db, transformed_player)
            logger.info({
                "message": "Successfully loaded single player",
                "player_id": transformed_player.get("id") if transformed_player else None,
            })
        except Exception as e:
            logger.error({
                "message": "Failed to load single player",
                "player_id": transformed_player.get("id") if transformed_player else None,
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()

    def load_players(self, transformed_players):
        """
        Loads multiple transformed players into the database.
        """
        logger.info({
            "message": "Starting players batch load",
            "player_count": len(transformed_players or []),
        })
        db = SessionLocal()
        try:
            rows = upsert_players(db, transformed_players)
            logger.info({
                "message": "Successfully upserted players",
                "row_count": rows,
            })
        except Exception as e:
            logger.error({
                "message": "Failed to load players",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()
