import os
import logging
import random
import asyncio
from typing import Any
from config.settings import Settings
from playwright.async_api import async_playwright
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

BASE_URL = "https://www.sofascore.com/api/v1"

class StealthSofascoreAPI:
    """
    A stealthy version of SofascoreAPI designed to bypass 403 Forbidden 
    errors in production environments (datacenter IPs).
    """
    def __init__(self, settings: Settings = None):
        self.settings = settings if settings else Settings()
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None
        self.ua = UserAgent()

    async def _init_browser(self):
        if self.playwright is None:
            logger.info("Initializing stealthy browser session")
            self.playwright = await async_playwright().start()
            try:
                from playwright_stealth import stealth_async
            except Exception as exc:
                stealth_async = None
                logger.warning({
                    "message": "playwright_stealth unavailable; continuing without stealth patch",
                    "error": {"message": str(exc), "type": type(exc).__name__},
                })
            
            # Use extra launch args to further reduce bot detection
            launch_kwargs = {
                "headless": True,
                "args": [
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            }

            # Inject proxy if configured
            proxy_server = self.settings.PROXY_SERVER
            if proxy_server:
                logger.info(f"Using proxy server: {proxy_server}")
                proxy_config = {"server": proxy_server}
                
                proxy_user = self.settings.PROXY_USER
                proxy_pass = self.settings.PROXY_PASSWORD
                if proxy_user and proxy_pass:
                    proxy_config["username"] = proxy_user
                    proxy_config["password"] = proxy_pass
                
                launch_kwargs["proxy"] = proxy_config

            self.browser = await self.playwright.chromium.launch(**launch_kwargs)
            
            # Create a context with a random User-Agent
            user_agent = self.ua.random
            self.context = await self.browser.new_context(
                user_agent=user_agent,
                viewport={"width": 1920, "height": 1080}
            )
            
            self.page = await self.context.new_page()
            
            # Apply stealth plugin
            if stealth_async is not None:
                await stealth_async(self.page)
            else:
                logger.info({"message": "Skipping stealth patch because playwright_stealth is unavailable"})
            
            # Add some extra headers to mimic a real browser
            await self.page.set_extra_http_headers({
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": "https://www.sofascore.com/",
                "Origin": "https://www.sofascore.com",
                "x-requested-with": "XMLHttpRequest",
                "cache-control": "no-cache",
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
