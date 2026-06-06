import logging
from typing import Any
from datetime import datetime
import enum
import re

logger = logging.getLogger(__name__)

class PlayersTransformations:
    @staticmethod
    def _camel_to_kebab(value: str) -> str:
        """Convert camelCase/PascalCase keys to kebab-case."""
        return re.sub(r"(?<!^)(?=[A-Z])", "-", value).lower()

    def _to_kebab_case_keys(self, payload: Any) -> Any:
        """Recursively convert dictionary keys to kebab-case."""
        if isinstance(payload, dict):
            return {
                self._camel_to_kebab(str(key)): self._to_kebab_case_keys(val)
                for key, val in payload.items()
            }
        if isinstance(payload, list):
            return [self._to_kebab_case_keys(item) for item in payload]
        return payload

    def transform_player_info(self, player_info, player_stats=None):
        """
        Transforms player information and statistics from Sofascore format to DB format.
        """
        player = player_info.get("player", {})
        player_id = player.get("id")
        player_name = player.get("name")

        logger.info({
            "message": "Starting transform_player_info",
            "player_id": player_id,
            "player_name": player_name,
            "has_stats": player_stats is not None
        })
        
        # Convert timestamp to date
        dob = datetime.fromtimestamp(player.get("dateOfBirthTimestamp")).date() if player.get("dateOfBirthTimestamp") else None

        result = {
            "id": player_id,
            "name": player_name,
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

        if player_stats:
            rating, stats_json = self.transform_player_stats(player_stats)
            result["rating"] = rating
            result["stats_json"] = stats_json

        logger.info({
            "message": "Completed transform_player_info",
            "player_id": player_id,
            "player_name": player_name
        })
        return result

    def transform_player_stats(self, player_stats) -> tuple[float | None, dict[str, Any] | None]:
        """
        Extracts only the statistics fields.
        """
        logger.info({"message": "Starting transform_player_stats"})
        if not player_stats or "statistics" not in player_stats:
            logger.warning({"message": "No statistics key found in player_stats"})
            return None, None
        
        stats = player_stats["statistics"]
        rating = stats.get("rating")
        kebab_stats = self._to_kebab_case_keys(stats)

        logger.info({
            "message": "Completed transform_player_stats",
            "rating": rating,
            "stats_keys_count": len(kebab_stats) if kebab_stats else 0
        })
        return rating, kebab_stats
