import logging

import requests

from config.settings import Settings

logger = logging.getLogger(__name__)


class FifaRankingSource:
    """
    Source class for the historical FIFA world ranking dataset (Dato-Futbol,
    github.com/Dato-Futbol/fifa-ranking). Public CSV, no auth, covers every
    published ranking date back to 1992.
    """

    def __init__(self):
        self.settings = Settings()

    def get_historical_rankings_csv(self) -> str:
        logger.info({
            "message": "Fetching historical FIFA ranking CSV",
            "url": self.settings.FIFA_HISTORICAL_RANKING_CSV_URL,
        })
        response = requests.get(self.settings.FIFA_HISTORICAL_RANKING_CSV_URL, timeout=30)
        response.raise_for_status()
        logger.info({
            "message": "Fetched historical FIFA ranking CSV",
            "byte_count": len(response.content),
        })
        return response.text
