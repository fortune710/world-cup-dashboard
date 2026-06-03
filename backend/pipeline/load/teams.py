import logging

from config.db import SessionLocal
from db.controllers.teams import upsert_team
from db.controllers.matches import upsert_match

logger = logging.getLogger(__name__)

class TeamsLoader:
    """
    Loader class to push transformed data into the Postgres database.
    """

    def load_teams(self, transformed_teams):
        """
        Loads teams into the teams table.
        """
        logger.info({
            "message": "Starting teams loader",
            "team_count": len(transformed_teams or []),
        })
        db = SessionLocal()
        try:
            for team in transformed_teams:
                upsert_team(db, team)
            logger.info({
                "message": "Successfully loaded teams",
                "team_count": len(transformed_teams or []),
            })
        except Exception as e:
            logger.error({
                "message": "Failed to load teams",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()

    def load_matches(self, transformed_matches):
        """
        Loads matches into the matches table.
        """
        logger.info({
            "message": "Starting teams loader match load",
            "match_count": len(transformed_matches or []),
        })
        db = SessionLocal()
        try:
            for match in transformed_matches:
                upsert_match(db, match)
            logger.info({
                "message": "Successfully loaded matches from teams loader",
                "match_count": len(transformed_matches or []),
            })
        except Exception as e:
            logger.error({
                "message": "Failed to load matches from teams loader",
                "error": {"message": str(e), "type": type(e).__name__},
            })
            raise
        finally:
            db.close()
