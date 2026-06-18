import logging
from typing import Any
from datetime import datetime
import enum
import re

logger = logging.getLogger(__name__)

class PlayersTransformations:
    @staticmethod
    def _camel_to_snake(value: str) -> str:
        """Convert camelCase/PascalCase keys to snake_case."""
        return re.sub(r"(?<!^)(?=[A-Z])", "_", value).lower()

    def _to_snake_case_keys(self, payload: Any) -> Any:
        """Recursively convert dictionary keys to snake_case."""
        if isinstance(payload, dict):
            return {
                self._camel_to_snake(str(key)): self._to_snake_case_keys(val)
                for key, val in payload.items()
            }
        if isinstance(payload, list):
            return [self._to_snake_case_keys(item) for item in payload]
        return payload

    def transform_player_info(self, player_info, image_url=None):
        """
        Transforms player information from Sofascore format to DB format.
        """
        player = player_info.get("player", {})
        player_id = player.get("id")
        player_name = player.get("name")

        logger.info({
            "message": "Starting transform_player_info",
            "player_id": player_id,
            "player_name": player_name,
            "has_image_url": image_url is not None
        })
        
        # Convert timestamp to date
        dob = datetime.fromtimestamp(player.get("dateOfBirthTimestamp")).date() if player.get("dateOfBirthTimestamp") else None

        # Safely parse positionsDetailed list or string
        positions_raw = player.get("positionsDetailed")
        if isinstance(positions_raw, list):
            positions = ", ".join([str(p).strip() for p in positions_raw if p is not None and str(p).strip()])
        elif isinstance(positions_raw, str) and positions_raw.strip():
            positions = ", ".join([p.strip() for p in positions_raw.split(",") if p.strip()])
        else:
            positions = player.get("position") or ""

        if not positions:
            logger.warning({
                "message": "transform_player_info: no position data for player",
                "player_id": player_id
            })

        transformed_player = {
            "id": player_id,
            "name": player_name,
            "date_of_birth": dob,
            "classification": player.get("position"), # Assumes model Enum matches (G, D, M, F)
            "club_name": (player.get("team") or {}).get("name"),
            "positions": positions,
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
            "player_name": transformed_player.get("name")
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
            logger.warning({
                "message": "Player stats payload missing statistics block",
                "has_stats": bool(player_stats),
                "statistics_present": isinstance(player_stats, dict) and "statistics" in player_stats,
            })
            return None, None
        
        stats = player_stats["statistics"]
        rating = stats.get("rating")
        transformed_stats = self._to_snake_case_keys(stats)

        logger.info({
            "message": "Transformed player stats payload",
            "has_rating": rating is not None,
            "field_count": len(transformed_stats) if isinstance(transformed_stats, dict) else 0,
        })
        return rating, transformed_stats
