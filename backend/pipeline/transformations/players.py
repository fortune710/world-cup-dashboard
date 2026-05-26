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
        
        # Extract rating from stats if available
        rating = None
        if player_stats and "statistics" in player_stats:
            rating = player_stats["statistics"].get("rating")

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
            "rating": rating
        }
