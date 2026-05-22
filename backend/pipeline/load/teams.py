from backend.config.db import SessionLocal
from backend.db.controllers.teams import upsert_team
from backend.db.controllers.matches import upsert_match

class TeamsLoader:
    """
    Loader class to push transformed data into the Postgres database.
    """

    def load_teams(self, transformed_teams):
        """
        Loads teams into the teams table.
        """
        db = SessionLocal()
        try:
            for team in transformed_teams:
                upsert_team(db, team)
            print(f"Successfully loaded {len(transformed_teams)} teams.")
        finally:
            db.close()

    def load_matches(self, transformed_matches):
        """
        Loads matches into the matches table.
        """
        db = SessionLocal()
        try:
            for match in transformed_matches:
                upsert_match(db, match)
            print(f"Successfully loaded {len(transformed_matches)} matches.")
        finally:
            db.close()
