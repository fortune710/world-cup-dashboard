import logging

from server.image_browser import fetch_image_bytes

logger = logging.getLogger(__name__)

SOFASCORE_PLAYER_IMAGE_TEMPLATE = "https://img.sofascore.com/api/v1/player/{player_id}/image"


def build_player_image_api_path(player_id: int) -> str:
    logger.info(
        {
            "message": "Built player image API path",
            "player_id": player_id,
        }
    )
    return f"/players/{player_id}/image"


def resolve_player_image_source_url(player_id: int, stored_url: str | None) -> str:
    source_url = stored_url if stored_url and stored_url.startswith("http") else None
    if source_url is None:
        source_url = SOFASCORE_PLAYER_IMAGE_TEMPLATE.format(player_id=player_id)

    logger.info(
        {
            "message": "Resolved player image source URL",
            "player_id": player_id,
            "uses_stored_url": bool(stored_url and stored_url.startswith("http")),
            "source_url": source_url,
        }
    )
    return source_url


async def fetch_player_image_bytes(source_url: str) -> tuple[bytes, str]:
    logger.info(
        {
            "message": "Fetching player image from upstream",
            "source_url": source_url,
        }
    )
    try:
        content, content_type = await fetch_image_bytes(source_url)
    except ValueError:
        logger.warning(
            {
                "message": "Upstream player image request returned non-success status",
                "source_url": source_url,
            }
        )
        raise
    except Exception as exc:
        logger.error(
            {
                "message": "Failed to fetch player image from upstream",
                "source_url": source_url,
                "error": {"message": str(exc), "type": type(exc).__name__},
            }
        )
        raise

    logger.info(
        {
            "message": "Fetched player image from upstream",
            "source_url": source_url,
            "content_type": content_type,
            "byte_length": len(content),
        }
    )
    return content, content_type
