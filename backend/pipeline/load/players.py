from config.db import SessionLocal
from db.controllers.players import upsert_player, upsert_players

class PlayersLoader:
    def load_player(self, transformed_player):
        """
        Loads a single transformed player into the database.
        """
        db = SessionLocal()
        try:
            upsert_player(db, transformed_player)
        finally:
            db.close()

    def load_players(self, transformed_players):
        """
        Loads multiple transformed players into the database.
        """
        db = SessionLocal()
        try:
            rows = upsert_players(db, transformed_players)
            print(f"Successfully upserted {rows} players.")
        finally:
            db.close()
