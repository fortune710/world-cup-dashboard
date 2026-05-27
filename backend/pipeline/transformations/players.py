from typing import Any
from datetime import datetime
import enum

class PlayersTransformations:
    def transform_player_info(self, player_info, player_stats=None):
        """
        Transforms player information and statistics from Sofascore format to DB format.
        """
        player = player_info.get("player", {})
        
        # Convert timestamp to date
        dob = datetime.fromtimestamp(player.get("dateOfBirthTimestamp")).date() if player.get("dateOfBirthTimestamp") else None

        return {
            "id": player.get("id"),
            "name": player.get("name"),
            "date_of_birth": dob,
            "classification": player.get("position"), # Assumes model Enum matches (G, D, M, F)
            "club_name": (player.get("team") or {}).get("name"),
            "positions": player.get("position"),
            "weight_kg": player.get("weight"),
            "height_cm": player.get("height"),
            "foot": player.get("preferredFoot"), # Assumes model Enum matches (Left, Right)
            "country_code": player.get("country", {}).get("alpha3"),
            "market_value": player.get("proposedMarketValue"),
        }

    def transform_player_stats(self, player_stats) -> tuple[float | None, dict[str, Any] | None]:
        """
        Extracts only the statistics fields.
        """
        if not player_stats or "statistics" not in player_stats:
            return None, None
        
        stats = player_stats["statistics"]
        rating = stats.get("rating")
        return rating, stats
