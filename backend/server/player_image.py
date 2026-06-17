import logging

import requests

logger = logging.getLogger(__name__)

SOFASCORE_IMAGE_REFERER = "https://www.sofascore.com/"
SOFASCORE_PLAYER_IMAGE_TEMPLATE = "https://img.sofascore.com/api/v1/player/{player_id}/image"
DEFAULT_IMAGE_REQUEST_HEADERS = {
    "Referer": SOFASCORE_IMAGE_REFERER,
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
}


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


def fetch_player_image_bytes(source_url: str) -> tuple[bytes, str]:
    logger.info(
        {
            "message": "Fetching player image from upstream",
            "source_url": source_url,
        }
    )
    try:
        upstream = requests.get(
            source_url,
            headers=DEFAULT_IMAGE_REQUEST_HEADERS,
            timeout=10,
        )
    except requests.RequestException as exc:
        logger.error(
            {
                "message": "Failed to fetch player image from upstream",
                "source_url": source_url,
                "error": {"message": str(exc), "type": type(exc).__name__},
            }
        )
        raise

    if upstream.status_code != 200:
        logger.warning(
            {
                "message": "Upstream player image request returned non-success status",
                "source_url": source_url,
                "status_code": upstream.status_code,
            }
        )
        raise ValueError(f"upstream_status_{upstream.status_code}")

    content_type = upstream.headers.get("Content-Type", "image/jpeg")
    logger.info(
        {
            "message": "Fetched player image from upstream",
            "source_url": source_url,
            "content_type": content_type,
            "byte_length": len(upstream.content),
        }
    )
    return upstream.content, content_type
