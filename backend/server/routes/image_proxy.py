import logging
from urllib.parse import urlparse

import requests
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["image-proxy"])

ALLOWED_IMAGE_HOSTS = {
    "img.sofascore.com",
    "api.sofascore.com",
    "flagcdn.com",
}

IMAGE_REQUEST_HEADERS = {
    "Referer": "https://www.sofascore.com/",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
}


@router.get("/image-proxy")
def proxy_image(url: str = Query(..., min_length=1, description="Image URL to proxy")):
    logger.info({
        "message": "Proxying image request",
        "url": url,
    })

    parsed_url = urlparse(url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        logger.warning({
            "message": "Rejected invalid image proxy url",
            "url": url,
        })
        raise HTTPException(status_code=400, detail="Invalid image url")

    if parsed_url.netloc not in ALLOWED_IMAGE_HOSTS:
        logger.warning({
            "message": "Rejected image proxy url with disallowed host",
            "url": url,
            "host": parsed_url.netloc,
        })
        raise HTTPException(status_code=400, detail="Image host not allowed")

    try:
        upstream = requests.get(url, headers=IMAGE_REQUEST_HEADERS, timeout=10)
    except requests.RequestException as exc:
        logger.error({
            "message": "Failed to fetch image from upstream",
            "url": url,
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise HTTPException(status_code=502, detail="Failed to fetch image") from None

    if upstream.status_code != 200:
        logger.warning({
            "message": "Upstream image request returned non-success status",
            "url": url,
            "status_code": upstream.status_code,
        })
        status_code = 404 if upstream.status_code == 404 else 502
        raise HTTPException(status_code=status_code, detail="Image unavailable")

    content_type = upstream.headers.get("Content-Type", "image/jpeg")
    logger.info({
        "message": "Fetched image from upstream",
        "url": url,
        "content_type": content_type,
        "byte_length": len(upstream.content),
    })

    return Response(
        content=upstream.content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
