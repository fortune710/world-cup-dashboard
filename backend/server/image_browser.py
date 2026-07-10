import asyncio
import logging
import time
from collections import OrderedDict
from typing import Optional

from fake_useragent import UserAgent
from playwright.async_api import async_playwright, Browser, BrowserContext, Playwright

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 24 * 60 * 60
CACHE_MAX_ENTRIES = 1000

_cache: OrderedDict[str, tuple[bytes, str, float]] = OrderedDict()

_playwright: Optional[Playwright] = None
_browser: Optional[Browser] = None
_context: Optional[BrowserContext] = None
_init_lock = asyncio.Lock()

LAUNCH_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-setuid-sandbox",
]

REQUEST_HEADERS = {
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Referer": "https://www.sofascore.com/",
    "Origin": "https://www.sofascore.com",
}


async def startup():
    """Launch the shared headless browser used to fetch images past Sofascore's bot protection."""
    global _playwright, _browser, _context
    async with _init_lock:
        if _browser is not None:
            return
        logger.info({"message": "Launching shared image-fetch browser"})
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(headless=True, args=LAUNCH_ARGS)
        _context = await _browser.new_context(
            user_agent=UserAgent().random,
            viewport={"width": 1920, "height": 1080},
        )
        await _context.set_extra_http_headers(REQUEST_HEADERS)


async def shutdown():
    global _playwright, _browser, _context
    async with _init_lock:
        if _context:
            await _context.close()
        if _browser:
            await _browser.close()
        if _playwright:
            await _playwright.stop()
        _context = None
        _browser = None
        _playwright = None
        logger.info({"message": "Shared image-fetch browser closed"})


def _cache_get(url: str) -> Optional[tuple[bytes, str]]:
    cached = _cache.get(url)
    if cached is None:
        return None
    content, content_type, cached_at = cached
    if time.monotonic() - cached_at >= CACHE_TTL_SECONDS:
        _cache.pop(url, None)
        return None
    _cache.move_to_end(url)
    return content, content_type


def _cache_set(url: str, content: bytes, content_type: str):
    _cache[url] = (content, content_type, time.monotonic())
    _cache.move_to_end(url)
    while len(_cache) > CACHE_MAX_ENTRIES:
        _cache.popitem(last=False)


async def fetch_image_bytes(url: str) -> tuple[bytes, str]:
    """Fetch an image through a real headless browser session, since Sofascore now
    blocks plain HTTP requests regardless of spoofed headers."""
    cached = _cache_get(url)
    if cached is not None:
        return cached

    if _context is None:
        await startup()

    try:
        from playwright_stealth import stealth_async
    except Exception:
        stealth_async = None

    page = await _context.new_page()
    try:
        if stealth_async is not None:
            await stealth_async(page)
        response = await page.goto(url, wait_until="networkidle", timeout=15000)
        if response is None:
            raise ValueError("upstream_no_response")
        if response.status != 200:
            raise ValueError(f"upstream_status_{response.status}")
        content = await response.body()
        content_type = response.headers.get("content-type", "image/jpeg")
    finally:
        await page.close()

    _cache_set(url, content, content_type)
    return content, content_type
