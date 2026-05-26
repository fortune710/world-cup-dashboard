from config.settings import Settings
from sofascore_wrapper.api import SofascoreAPI
from sofascore_wrapper.player import Player

"""
{
    "statistics": {
        "rating": 6.5333333333333,
        "totalRating": 19.6,
        "countRating": 3,
        "goals": 0,
        "bigChancesCreated": 0,
        "bigChancesMissed": 0,
        "assists": 0,
        "expectedAssists": 0.00207642,
        "goalsAssistsSum": 0,
        "accuratePasses": 38,
        "inaccuratePasses": 30,
        "totalPasses": 68,
        "accuratePassesPercentage": 55.882352941176,
        "accurateOwnHalfPasses": 29,
        "accurateOppositionHalfPasses": 9,
        "accurateFinalThirdPasses": 1,
        "keyPasses": 0,
        "successfulDribbles": 0,
        "successfulDribblesPercentage": 0,
        "tackles": 0,
        "interceptions": 0,
        "yellowCards": 0,
        "directRedCards": 0,
        "redCards": 0,
        "accurateCrosses": 0,
        "accurateCrossesPercentage": 0,
        "totalShots": 0,
        "shotsOnTarget": 0,
        "shotsOffTarget": 0,
        "groundDuelsWon": 0,
        "groundDuelsWonPercentage": 0,
        "aerialDuelsWon": 2,
        "aerialDuelsWonPercentage": 100,
        "totalDuelsWon": 2,
        "totalDuelsWonPercentage": 100,
        "minutesPlayed": 270,
        "goalConversionPercentage": 0,
        "penaltiesTaken": 0,
        "penaltyGoals": 0,
        "penaltyWon": 0,
        "penaltyConceded": 0,
        "shotFromSetPiece": 0,
        "freeKickGoal": 0,
        "goalsFromInsideTheBox": 0,
        "goalsFromOutsideTheBox": 0,
        "shotsFromInsideTheBox": 0,
        "shotsFromOutsideTheBox": 0,
        "headedGoals": 0,
        "leftFootGoals": 0,
        "rightFootGoals": 0,
        "accurateLongBalls": 13,
        "accurateLongBallsPercentage": 30.232558139535,
        "clearances": 3,
        "errorLeadToGoal": 0,
        "errorLeadToShot": 0,
        "dispossessed": 0,
        "possessionLost": 30,
        "possessionWonAttThird": 0,
        "totalChippedPasses": 29,
        "accurateChippedPasses": 10,
        "touches": 80,
        "wasFouled": 0,
        "fouls": 0,
        "hitWoodwork": 0,
        "ownGoals": 0,
        "dribbledPast": 0,
        "offsides": 0,
        "blockedShots": 0,
        "passToAssist": 0,
        "saves": 1,
        "goalsPrevented": -0.926,
        "cleanSheet": 1,
        "penaltyFaced": 1,
        "penaltySave": 0,
        "savedShotsFromInsideTheBox": 1,
        "savedShotsFromOutsideTheBox": 0,
        "goalsConcededInsideTheBox": 2,
        "goalsConcededOutsideTheBox": 1,
        "punches": 3,
        "runsOut": 0,
        "successfulRunsOut": 0,
        "highClaims": 1,
        "crossesNotClaimed": 0,
        "matchesStarted": 3,
        "penaltyConversion": 0,
        "setPieceConversion": 0,
        "totalAttemptAssist": 0,
        "totalContest": 0,
        "totalCross": 0,
        "duelLost": 0,
        "aerialLost": 0,
        "attemptPenaltyMiss": 0,
        "attemptPenaltyPost": 0,
        "attemptPenaltyTarget": 0,
        "totalLongBalls": 43,
        "goalsConceded": 3,
        "tacklesWon": 0,
        "tacklesWonPercentage": 0,
        "scoringFrequency": 0,
        "yellowRedCards": 0,
        "savesCaught": 0,
        "savesParried": 0,
        "totalOwnHalfPasses": 30,
        "totalOppositionHalfPasses": 38,
        "totwAppearances": 0,
        "expectedGoals": 0,
        "goalKicks": 21,
        "ballRecovery": 18,
        "outfielderBlocks": 0,
        "id": 923598,
        "type": "overall",
        "appearances": 3,
        "statisticsType": {
            "sportSlug": "football",
            "statisticsType": "player"
        }
    },
    "team": {
        "name": "Ecuador",
        "slug": "ecuador",
        "shortName": "Ecuador",
        "gender": "M",
        "sport": {
            "name": "Football",
            "slug": "football",
            "id": 1
        },
        "userCount": 174112,
        "nameCode": "ECU",
        "ranking": 23,
        "disabled": false,
        "national": true,
        "type": 0,
        "id": 4757,
        "teamColors": {
            "primary": "#ffff00",
            "secondary": "#000063",
            "text": "#000063"
        },
        "fieldTranslations": {
            "nameTranslation": {
                "ar": "\u0627\u0644\u0627\u0643\u0648\u0627\u062f\u0648\u0631",
                "bn": "\u0987\u0995\u09c1\u09af\u09bc\u09c7\u09a1\u09b0",
                "hi": "\u0907\u0915\u094d\u0935\u093e\u0921\u094b\u0930",
                "ru": "\u042d\u043a\u0432\u0430\u0434\u043e\u0440"
            },
            "shortNameTranslation": {}
        }
    }
}
"""

class PlayersSource:
    def __init__(self, player_id: int = None, api: SofascoreAPI = None):
        self.api = api if api else SofascoreAPI()
        self.player_id = player_id
        self.player = Player(self.api, player_id) if player_id else None
        self.settings = Settings()

    def get_player_stats(self, player_id: int = None):
        target_player = Player(self.api, player_id) if not self.player else self.player
        
        return target_player.league_stats(
            season=self.settings.WC_SEASON_ID_2026, # Use current WC season
            league_id=self.settings.WC_LEAGUE_ID
        )

    async def get_player_info(self, player_id: int = None):
        target_player = self.player
        if player_id:
            target_player = Player(self.api, player_id)
        
        player_data = await target_player.get_player()
        await self.api.close()
        return player_data
        """
         {
            "player": {
                "name": "Bukayo Saka",
                "firstName": "",
                "lastName": "",
                "slug": "bukayo-saka",
                "shortName": "B. Saka",
                "team": {
                    "name": "Arsenal",
                    "slug": "arsenal",
                    "shortName": "Arsenal",
                    "gender": "M",
                    "sport": {
                        "name": "Football",
                        "slug": "football",
                        "id": 1
                    },
                    "tournament": {
                        "name": "Premier League",
                        "slug": "premier-league",
                        "category": {
                            "name": "England",
                            "slug": "england",
                            "sport": {
                                "name": "Football",
                                "slug": "football",
                                "id": 1
                            },
                            "id": 1,
                            "country": {
                                "alpha2": "EN",
                                "alpha3": "ENG",
                                "name": "England",
                                "slug": "england"
                            },
                            "flag": "england",
                            "alpha2": "EN"
                        },
                        "uniqueTournament": {
                            "name": "Premier League",
                            "slug": "premier-league",
                            "primaryColorHex": "#3c1c5a",
                            "secondaryColorHex": "#f80158",
                            "category": {
                                "name": "England",
                                "slug": "england",
                                "sport": {
                                    "name": "Football",
                                    "slug": "football",
                                    "id": 1
                                },
                                "id": 1,
                                "country": {
                                    "alpha2": "EN",
                                    "alpha3": "ENG",
                                    "name": "England",
                                    "slug": "england"
                                },
                                "flag": "england",
                                "alpha2": "EN"
                            },
                            "userCount": 1361165,
                            "id": 17,
                            "country": {},
                            "displayInverseHomeAwayTeams": false,
                            "fieldTranslations": {
                                "nameTranslation": {
                                    "ar": "الدوري الإنجليزي الممتاز",
                                    "hi": "प्रिमियर लीग",
                                    "bn": "প্রিমিয়ার লীগ"
                                },
                                "shortNameTranslation": {}
                            }
                        },
                        "priority": 617,
                        "isLive": false,
                        "id": 1,
                        "fieldTranslations": {
                            "nameTranslation": {
                                "ar": "الدوري الإنجليزي الممتاز",
                                "hi": "प्रिमियर लीग",
                                "bn": "প্রিমিয়ার লীগ"
                            },
                            "shortNameTranslation": {}
                        }
                    },
                    "primaryUniqueTournament": {
                        "name": "Premier League",
                        "slug": "premier-league",
                        "primaryColorHex": "#3c1c5a",
                        "secondaryColorHex": "#f80158",
                        "category": {
                            "name": "England",
                            "slug": "england",
                            "sport": {
                                "name": "Football",
                                "slug": "football",
                                "id": 1
                            },
                            "id": 1,
                            "country": {
                                "alpha2": "EN",
                                "alpha3": "ENG",
                                "name": "England",
                                "slug": "england"
                            },
                            "flag": "england",
                            "alpha2": "EN"
                        },
                        "userCount": 1361165,
                        "id": 17,
                        "country": {},
                        "displayInverseHomeAwayTeams": false,
                        "fieldTranslations": {
                            "nameTranslation": {
                                "ar": "الدوري الإنجليزي الممتاز",
                                "hi": "प्रिमियर लीग",
                                "bn": "প্রিমিয়ার লীগ"
                            },
                            "shortNameTranslation": {}
                        }
                    },
                    "userCount": 2341486,
                    "nameCode": "ARS",
                    "disabled": false,
                    "national": false,
                    "type": 0,
                    "id": 42,
                    "country": {
                        "alpha2": "EN",
                        "alpha3": "ENG",
                        "name": "England",
                        "slug": "england"
                    },
                    "entityType": "team",
                    "teamColors": {
                        "primary": "#cc0000",
                        "secondary": "#ffffff",
                        "text": "#ffffff"
                    },
                    "fieldTranslations": {
                        "nameTranslation": {
                            "ar": "ارسنال",
                            "ru": "Арсенал",
                            "hi": "आर्सेनल",
                            "bn": "আর্সেনাল"
                        },
                        "shortNameTranslation": {
                            "ar": "ارسنال",
                            "hi": "आर्सेनल",
                            "bn": "আর্সেনাল"
                        }
                    }
                },
                "position": "F",
                "jerseyNumber": "7",
                "height": 178,
                "preferredFoot": "Left",
                "retired": false,
                "userCount": 168684,
                "gender": "M",
                "id": 934235,
                "country": {
                    "alpha2": "EN",
                    "alpha3": "ENG",
                    "name": "England",
                    "slug": "england"
                },
                "shirtNumber": 7,
                "dateOfBirthTimestamp": 999648000,
                "contractUntilTimestamp": 1814313600,
                "proposedMarketValue": 157000000,
                "proposedMarketValueRaw": {
                    "value": 157000000,
                    "currency": "EUR"
                },
                "fieldTranslations": {
                    "nameTranslation": {
                        "ar": "بوكايو ساكا",
                        "hi": "बुकायो साका",
                        "bn": "বুকায়ো সাকা"
                    },
                    "shortNameTranslation": {
                        "ar": "ب. ساكا",
                        "hi": "बी. साका",
                        "bn": "বি. সাকা"
                    }
                }
            }
        }
        """
        player = self.player.get_player()
        await self.api.close()
        return player