from config.db import SessionLocal
from db.controllers.matches import upsert_match

class MatchesLoader:
    """
    Loader class for World Cup matches data.
    """

    def load_matches(self, transformed_matches):
        """
        Loads match data into the database.
        """
        db = SessionLocal()
        try:
            for match in transformed_matches:
                upsert_match(db, match)
            print(f"Successfully loaded {len(transformed_matches)} matches.")
        finally:
            db.close()
