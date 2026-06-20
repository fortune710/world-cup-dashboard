import logging
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["image-proxy"])


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

    logger.info({
        "message": "Redirecting image proxy request",
        "url": url,
    })
    return RedirectResponse(url=url, status_code=307)
