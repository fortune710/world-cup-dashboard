import logging
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from server.image_browser import fetch_image_bytes

logger = logging.getLogger(__name__)

router = APIRouter(tags=["image-proxy"])

ALLOWED_IMAGE_HOSTS = {
    "img.sofascore.com",
    "api.sofascore.com",
    "flagcdn.com",
}


@router.get("/image-proxy")
async def proxy_image(url: str = Query(..., min_length=1, description="Image URL to proxy")):
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
        content, content_type = await fetch_image_bytes(url)
    except ValueError as exc:
        logger.warning({
            "message": "Upstream image request returned non-success status",
            "url": url,
            "error": str(exc),
        })
        status_code = 404 if str(exc) == "upstream_status_404" else 502
        raise HTTPException(status_code=status_code, detail="Image unavailable") from None
    except Exception as exc:
        logger.error({
            "message": "Failed to fetch image from upstream",
            "url": url,
            "error": {"message": str(exc), "type": type(exc).__name__},
        })
        raise HTTPException(status_code=502, detail="Failed to fetch image") from None

    logger.info({
        "message": "Fetched image from upstream",
        "url": url,
        "content_type": content_type,
        "byte_length": len(content),
    })

    return Response(
        content=content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
