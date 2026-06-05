from typing import Any
from datetime import datetime
import enum
import logging
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

    def transform_player_info(self, player_info, image_url=None):
        """
        Transforms player information from Sofascore format to DB format.
        """
        logger.info({
            "message": "Transforming player info payload",
            "has_image_url": image_url is not None,
        })
        player = player_info.get("player", {})
        
        # Convert timestamp to date
        dob = datetime.fromtimestamp(player.get("dateOfBirthTimestamp")).date() if player.get("dateOfBirthTimestamp") else None

        transformed_player = {
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
            "image_url": image_url
        }
        logger.info({
            "message": "Transformed player info payload",
            "player_id": transformed_player.get("id"),
            "player_name": transformed_player.get("name"),
        })
        return transformed_player

    def transform_player_stats(self, player_stats) -> tuple[float | None, dict[str, Any] | None]:
        """
        Extracts only the statistics fields.
        """
        logger.info({
            "message": "Transforming player stats payload",
            "has_stats": bool(player_stats),
        })
        if not player_stats or "statistics" not in player_stats:
            logger.info({
                "message": "Player stats payload missing statistics block",
            })
            return None, None
        
        stats = player_stats["statistics"]
        rating = stats.get("rating")
        transformed_stats = self._to_kebab_case_keys(stats)
        logger.info({
            "message": "Transformed player stats payload",
            "has_rating": rating is not None,
            "field_count": len(transformed_stats) if isinstance(transformed_stats, dict) else 0,
        })
        return rating, transformed_stats
