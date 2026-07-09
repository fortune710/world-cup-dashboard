import logging
from typing import Any

from sofascore_wrapper.league import League
from sofascore_wrapper.match import Match

from config.settings import Settings
from pipeline.sources.stealth_api import StealthSofascoreAPI

logger = logging.getLogger(__name__)


class HistoricalMatchesSource:
    """
    Source class for backfilling pre-WC26 knockout match facts from Sofascore.

    Sofascore has no round-number endpoint for World Cup knockout fixtures
    (`cup_fixtures_per_round` 404s for this tournament) -- the real match ids
    live in `cup_tree()`'s per-round `blocks[*].events` arrays, including the
    3rd-place playoff, which is bundled as a second block under the "Final"
    round rather than its own round.
    """

    def __init__(self, api: Any = None):
        self.settings = Settings()
        self.sofascore_api = api if api else StealthSofascoreAPI()

    async def _discover_event_ids(self, season_id: int) -> list[int]:
        league = League(self.sofascore_api, league_id=self.settings.WC_LEAGUE_ID)
        tree = await league.cup_tree(season_id)
        cup_trees = tree.get("cupTrees") or []
        if not cup_trees:
            logger.warning({"message": "No cup tree found for season", "season_id": season_id})
            return []

        event_ids: list[int] = []
        seen: set[int] = set()
        for cup_tree in cup_trees:
            for round_info in cup_tree.get("rounds") or []:
                for block in round_info.get("blocks") or []:
                    for event_id in block.get("events") or []:
                        if event_id not in seen:
                            seen.add(event_id)
                            event_ids.append(event_id)

        logger.info({
            "message": "Discovered knockout event ids from cup tree",
            "season_id": season_id,
            "event_count": len(event_ids),
        })
        return event_ids

    async def get_knockout_matches(self, season_id: int) -> list[dict]:
        """
        Fetches full match detail (teams, score, penalties, kickoff, round name)
        for every knockout event in the given season.
        """
        logger.info({"message": "Starting knockout match backfill for season", "season_id": season_id})
        try:
            event_ids = await self._discover_event_ids(season_id)
            matches = []
            for event_id in event_ids:
                try:
                    data = await Match(self.sofascore_api, event_id).get_match()
                    event = data.get("event", data)
                    matches.append(event)
                except Exception as exc:
                    logger.error({
                        "message": "Failed to fetch match detail during knockout backfill",
                        "season_id": season_id,
                        "event_id": event_id,
                        "error": {"message": str(exc), "type": type(exc).__name__},
                    })
                    continue

            logger.info({
                "message": "Completed knockout match backfill for season",
                "season_id": season_id,
                "match_count": len(matches),
            })
            return matches
        finally:
            await self.sofascore_api.close()
