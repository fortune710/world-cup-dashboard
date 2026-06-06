from typing import Any
import logging
from config.settings import Settings
from sofascore_wrapper.league import League
import requests
from sofascore_wrapper.api import SofascoreAPI
from pipeline.sources.stealth_api import StealthSofascoreAPI
from sofascore_wrapper.team import Team

logger = logging.getLogger(__name__)


class TeamsSource:
    """
    Source class for fetching World Cup 2026 data from the API.
    API Documentation: https://api.wc2026api.com/docs/json
    """
    def __init__(self, api: Any = None):
        self.settings = Settings()
        self.sofascore_api = api if api else StealthSofascoreAPI()
        self.BASE_URL = "https://api.wc2026api.com"
        self.API_KEY = self.settings.WC2026_API_KEY

    def get_flagpedia_codes(self):
        """
        Fetches the country codes and names from Flagcdn/Flagpedia.
        """
        logger.info({"message": "Fetching country codes from Flagpedia API"})
        try:
            response = requests.get("https://flagcdn.com/en/codes.json", timeout=10)
            response.raise_for_status()
            codes = response.json()
            logger.info({"message": "Successfully fetched Flagpedia codes", "count": len(codes)})
            return codes
        except Exception as e:
            logger.error({
                "message": "Failed to fetch Flagpedia codes",
                "error": {"message": str(e), "type": type(e).__name__}
            })
            return {}


    def get_teams(self):
        """
        Fetches all 48 teams.
        Returns:
            list: List of team objects.
            Fields returned by API:
                - id (int)
                - name (string)
                - code (string)
                - flag_url (string, nullable)
                - group_name (string)
        """
        response = requests.get(f"{self.BASE_URL}/teams", headers={"Authorization": f"Bearer {self.API_KEY}"})
        response.raise_for_status()
        return response.json()

    def get_matches(self):
        """
        Fetches all matches.
        Returns:
            list: List of match objects.
            Fields returned by API (based on sandbox/docs):
                - id (int)
                - match_number (int)
                - round (string)
                - group_name (string, nullable)
                - home_team (string)
                - home_team_code (string)
                - home_team_flag (string)
                - away_team (string)
                - away_team_code (string)
                - away_team_flag (string)
                - stadium (string)
                - stadium_city (string)
                - stadium_country (string)
                - kickoff_utc (string, ISO-8601)
                - status (string: scheduled, live, completed)
                - phase (string, nullable)
                - home_score (int)
                - away_score (int)
                - home_pen (int, nullable)
                - away_pen (int, nullable)
        """
        response = requests.get(f"{self.BASE_URL}/matches")
        response.raise_for_status()
        return response.json()

    async def get_players(self, team_id: int):
        """
        Each Player Object Looks like this:
        {
            "name": "Marcus Rashford",
            "firstName": "Marcus",
            "lastName": "Rashford",
            "slug": "marcus-rashford",
            "shortName": "M. Rashford",
            "team": {
                "name": "FC Barcelona",
                "slug": "barcelona",
                "shortName": "Barcelona",
                "gender": "M",
                "sport": {
                    "name": "Football",
                    "slug": "football",
                    "id": 1
                },
                "tournament": {
                    "name": "LaLiga",
                    "slug": "laliga",
                    "category": {
                        "name": "Spain",
                        "slug": "spain",
                        "sport": {
                            "name": "Football",
                            "slug": "football",
                            "id": 1
                        },
                        "priority": 9,
                        "country": {
                            "alpha2": "ES",
                            "alpha3": "ESP",
                            "name": "Spain",
                            "slug": "spain"
                        },
                        "id": 32,
                        "flag": "spain",
                        "alpha2": "ES",
                        "fieldTranslations": {
                            "nameTranslation": {
                                "ar": "\u0625\u0633\u0628\u0627\u0646\u064a\u0627",
                                "bn": "\u09b8\u09cd\u09aa\u09c7\u09a8",
                                "hi": "\u0938\u094d\u092a\u0947\u0928",
                                "ru": "\u0418\u0441\u043f\u0430\u043d\u0438\u044f"
                            },
                            "shortNameTranslation": {}
                        }
                    },
                    "uniqueTournament": {
                        "name": "LaLiga",
                        "slug": "laliga",
                        "primaryColorHex": "#2f4a89",
                        "secondaryColorHex": "#f4a32e",
                        "category": {
                            "name": "Spain",
                            "slug": "spain",
                            "sport": {
                                "name": "Football",
                                "slug": "football",
                                "id": 1
                            },
                            "priority": 9,
                            "country": {
                                "alpha2": "ES",
                                "alpha3": "ESP",
                                "name": "Spain",
                                "slug": "spain"
                            },
                            "id": 32,
                            "flag": "spain",
                            "alpha2": "ES",
                            "fieldTranslations": {
                                "nameTranslation": {
                                    "ar": "\u0625\u0633\u0628\u0627\u0646\u064a\u0627",
                                    "bn": "\u09b8\u09cd\u09aa\u09c7\u09a8",
                                    "hi": "\u0938\u094d\u092a\u0947\u0928",
                                    "ru": "\u0418\u0441\u043f\u0430\u043d\u0438\u044f"
                                },
                                "shortNameTranslation": {}
                            }
                        },
                        "userCount": 858924,
                        "country": {},
                        "id": 8,
                        "displayInverseHomeAwayTeams": false,
                        "fieldTranslations": {
                            "nameTranslation": {
                                "ar": "\u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0625\u0633\u0628\u0627\u0646\u064a",
                                "hi": "\u0932\u093e \u0932\u093f\u0917\u093e",
                                "bn": "\u09b2\u09be \u09b2\u09c0\u0997\u09be"
                            },
                            "shortNameTranslation": {}
                        }
                    },
                    "priority": 701,
                    "isLive": false,
                    "id": 36,
                    "fieldTranslations": {
                        "nameTranslation": {
                            "hi": "\u0932\u093e \u0932\u0940\u0917\u093e",
                            "ar": "\u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0625\u0633\u0628\u0627\u0646\u064a",
                            "bn": "\u09b2\u09be \u09b2\u09c0\u0997\u09be"
                        },
                        "shortNameTranslation": {}
                    }
                },
                "primaryUniqueTournament": {
                    "name": "LaLiga",
                    "slug": "laliga",
                    "primaryColorHex": "#2f4a89",
                    "secondaryColorHex": "#f4a32e",
                    "category": {
                        "name": "Spain",
                        "slug": "spain",
                        "sport": {
                            "name": "Football",
                            "slug": "football",
                            "id": 1
                        },
                        "priority": 9,
                        "country": {
                            "alpha2": "ES",
                            "alpha3": "ESP",
                            "name": "Spain",
                            "slug": "spain"
                        },
                        "id": 32,
                        "flag": "spain",
                        "alpha2": "ES",
                        "fieldTranslations": {
                            "nameTranslation": {
                                "ar": "\u0625\u0633\u0628\u0627\u0646\u064a\u0627",
                                "bn": "\u09b8\u09cd\u09aa\u09c7\u09a8",
                                "hi": "\u0938\u094d\u092a\u0947\u0928",
                                "ru": "\u0418\u0441\u043f\u0430\u043d\u0438\u044f"
                            },
                            "shortNameTranslation": {}
                        }
                    },
                    "userCount": 858924,
                    "country": {},
                    "id": 8,
                    "displayInverseHomeAwayTeams": false,
                    "fieldTranslations": {
                        "nameTranslation": {
                            "ar": "\u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0625\u0633\u0628\u0627\u0646\u064a",
                            "hi": "\u0932\u093e \u0932\u093f\u0917\u093e",
                            "bn": "\u09b2\u09be \u09b2\u09c0\u0997\u09be"
                        },
                        "shortNameTranslation": {}
                    }
                },
                "userCount": 7334378,
                "nameCode": "BAR",
                "disabled": false,
                "national": false,
                "type": 0,
                "country": {
                    "alpha2": "ES",
                    "alpha3": "ESP",
                    "name": "Spain",
                    "slug": "spain"
                },
                "id": 2817,
                "teamColors": {
                    "primary": "#154284",
                    "secondary": "#9d1009",
                    "text": "#9d1009"
                },
                "fieldTranslations": {
                    "nameTranslation": {
                        "ar": "\u0628\u0631\u0634\u0644\u0648\u0646\u0629",
                        "bn": "\u09ac\u09be\u09b0\u09cd\u09b8\u09c7\u09b2\u09cb\u09a8\u09be",
                        "hi": "\u092c\u093e\u0930\u094d\u0938\u093f\u0932\u094b\u0928\u093e",
                        "ru": "\u0411\u0430\u0440\u0441\u0435\u043b\u043e\u043d\u0430"
                    },
                    "shortNameTranslation": {}
                }
            },
            "position": "F",
            "positionsDetailed": [
                "LW"
            ],
            "weight": 70,
            "jerseyNumber": "14",
            "height": 185,
            "dateOfBirth": "1997-10-31T00:00:00+00:00",
            "preferredFoot": "Right",
            "userCount": 388246,
            "deceased": false,
            "gender": "M",
            "sofascoreId": "Rashford",
            "country": {
                "alpha2": "EN",
                "alpha3": "ENG",
                "name": "England",
                "slug": "england"
            },
            "id": 814590,
            "shirtNumber": 14,
            "dateOfBirthTimestamp": 878256000,
            "contractUntilTimestamp": 1782777600,
            "proposedMarketValue": 38000000,
            "proposedMarketValueRaw": {
                "value": 38000000,
                "currency": "EUR"
            }
        }
        """
        team = Team(self.sofascore_api, team_id=team_id)
        team_info = await team.squad()
        await self.sofascore_api.close()

        squad = []
        if "players" not in team_info:
            raise ValueError(f"'players' not found in the response. Keys present: {team_info.keys()}")
        
        for p_entry in team_info.get("players", []):
            if "player" not in p_entry:
                continue
            player = p_entry.get("player", {})
            stats = p_entry.get("statistics", {})
            # Merge stats into player dict (e.g., rating)
            if stats:
                player["rating"] = stats.get("rating")
            squad.append(player)
        return squad

    async def get_teams_details(self):
        logger.info({"message": "Starting get_teams_details to fetch team standings"})
        league = League(self.sofascore_api, league_id=self.settings.WC_LEAGUE_ID)
        try:
            standings_data = await league.standings(season=self.settings.WC_SEASON_ID_2026)
        except Exception as e:
            logger.error({
                "message": "Failed to fetch standings data from Sofascore",
                "error": {"message": str(e), "type": type(e).__name__}
            })
            await self.sofascore_api.close()
            raise

        if "standings" not in standings_data:
            await self.sofascore_api.close()
            err_msg = f"Standings not found in the response. Keys present: {list(standings_data.keys())}"
            logger.error({"message": err_msg})
            raise ValueError(err_msg)

        teams_data = []
        
        for group in standings_data["standings"]:
            group_name = group.get("name", "Tournament Table")
            logger.info({"message": "Processing standings group", "group_name": group_name})
            
            for row in group.get("rows", []):
                team_info: dict[str, Any] = row.get("team", {})
                team = Team(self.sofascore_api, team_id=team_info.get("id"))
                try:
                    team_image = await team.image()
                    logger.info({
                        "message": "Fetched team logo image from Sofascore",
                        "team_id": team_info.get("id"),
                        "team_name": team_info.get("name")
                    })
                except Exception as e:
                    logger.warning({
                        "message": "Failed to fetch team logo image from Sofascore, falling back to None",
                        "team_id": team_info.get("id"),
                        "team_name": team_info.get("name"),
                        "error": {"message": str(e), "type": type(e).__name__}
                    })
                    team_image = None
                
                # Merge row stats into team info
                data = {
                    **team_info,
                    "position": row.get("position"),
                    "matches_played": row.get("matches"),
                    "matches_won": row.get("wins"),
                    "matches_drawn": row.get("draws"),
                    "matches_lost": row.get("losses"),
                    "goals_for": row.get("scoresFor"),
                    "goals_against": row.get("scoresAgainst"),
                    "points": row.get("points"),
                    "image": team_image,
                    "group": group_name
                }
                teams_data.append(data)
        
        await self.sofascore_api.close()
        logger.info({"message": "Successfully retrieved team details standings", "teams_count": len(teams_data)})
        return teams_data
