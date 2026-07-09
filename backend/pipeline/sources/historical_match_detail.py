import logging
from typing import Any

from sofascore_wrapper.match import Match

from pipeline.sources.stealth_api import StealthSofascoreAPI

logger = logging.getLogger(__name__)


class HistoricalMatchDetailSource:
    """
    Source class for per-match Sofascore detail (stats, h2h, pre-match form) used to
    build xG/h2h/avg-rating features for historical knockout matches. `pre_match_form`
    404s for older matches (confirmed on a 2014 fixture) -- treated as "unavailable",
    not a hard failure, since `avg_player_rating_*` is a nullable feature.
    """

    def __init__(self, api: Any = None):
        self.sofascore_api = api if api else StealthSofascoreAPI()

    async def get_match_detail(self, sofascore_id: int) -> dict:
        logger.info({"message": "Fetching historical match detail", "sofascore_id": sofascore_id})
        match = Match(self.sofascore_api, sofascore_id)

        stats = None
        try:
            stats = await match.stats()
        except Exception as exc:
            logger.warning({
                "message": "Failed to fetch match stats",
                "sofascore_id": sofascore_id,
                "error": {"message": str(exc), "type": type(exc).__name__},
            })

        h2h = None
        try:
            h2h = await match.h2h()
        except Exception as exc:
            logger.warning({
                "message": "Failed to fetch match h2h",
                "sofascore_id": sofascore_id,
                "error": {"message": str(exc), "type": type(exc).__name__},
            })

        pre_match_form = None
        try:
            pre_match_form = await match.pre_match_form()
        except Exception as exc:
            logger.info({
                "message": "pre_match_form unavailable for match (expected for older fixtures)",
                "sofascore_id": sofascore_id,
                "error": {"message": str(exc), "type": type(exc).__name__},
            })

        logger.info({
            "message": "Completed historical match detail fetch",
            "sofascore_id": sofascore_id,
            "has_stats": stats is not None,
            "has_h2h": h2h is not None,
            "has_pre_match_form": pre_match_form is not None,
        })
        return {"stats": stats, "h2h": h2h, "pre_match_form": pre_match_form}
