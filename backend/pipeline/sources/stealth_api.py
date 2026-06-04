import logging
import random
import asyncio
from typing import Any
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

BASE_URL = "https://www.sofascore.com/api/v1"

class StealthSofascoreAPI:
    """
    A stealthy version of SofascoreAPI designed to bypass 403 Forbidden 
    errors in production environments (datacenter IPs).
    """
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None
        self.ua = UserAgent()

    async def _init_browser(self):
        if self.playwright is None:
            logger.info("Initializing stealthy browser session")
            self.playwright = await async_playwright().start()
            
            # Use extra launch args to further reduce bot detection
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            )
            
            # Create a context with a random User-Agent
            user_agent = self.ua.random
            self.context = await self.browser.new_context(
                user_agent=user_agent,
                viewport={"width": 1920, "height": 1080}
            )
            
            self.page = await self.context.new_page()
            
            # Apply stealth plugin
            await stealth_async(self.page)
            
            # Add some extra headers to mimic a real browser
            await self.page.set_extra_http_headers({
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.sofascore.com/",
                "sec-ch-ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin"
            })

    async def _get(self, endpoint: str) -> Any:
        try:
            await self._init_browser()
            url = f"{BASE_URL}{endpoint}"
            
            # Add a small random jitter to avoid rapid-fire detection
            await asyncio.sleep(random.uniform(0.5, 1.5))
            
            response = await self.page.goto(url, wait_until="networkidle")
            
            if response.status == 200:
                logger.debug(f"Successfully fetched {endpoint}")
                return await response.json()
            elif response.status == 403:
                logger.warning(f"403 Forbidden while fetching {endpoint}. Retrying with new session?")
                # One possibility is to close and re-init session here if needed
                raise Exception(f"403 Forbidden: Protected by anti-bot measures at {endpoint}")
            else:
                raise Exception(f"Failed to fetch {endpoint}: {response.status}")
        except Exception as e:
            logger.error(f"Error in StealthSofascoreAPI._get: {str(e)}")
            raise

    async def _raw_get(self, url: str) -> Any:
        try:
            await self._init_browser()
            
            await asyncio.sleep(random.uniform(0.5, 1.5))
            
            response = await self.page.goto(url, wait_until="networkidle")
            
            if response.status == 200:
                return await response.json()
            else:
                raise Exception(f"Failed to fetch {url}: {response.status}")
        except Exception as e:
            logger.error(f"Error in StealthSofascoreAPI._raw_get: {str(e)}")
            raise

    async def close(self):
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Stealthy browser session closed")
