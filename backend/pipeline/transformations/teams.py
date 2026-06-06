from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class TeamsTransformations:
    """
    Transformation layer for World Cup data.
    """

    def _get_flagpedia_code(self, name_to_code, team_name, team_code=None):
        """
        Finds the 2-letter ISO code from Flagpedia codes dictionary.
        """
        name_key = team_name.lower().strip()
        
        # 1. Check direct mapping
        if name_key in name_to_code:
            return name_to_code[name_key]
            
        # 2. Handle known variations/aliases
        aliases = {
            "usa": "us",
            "united states": "us",
            "south korea": "kr",
            "korea, republic of": "kr",
            "korea republic": "kr",
            "south africa": "za",
            "czechia": "cz",
            "czech republic": "cz",
            "bosnia": "ba",
            "bosnia and herzegovina": "ba",
            "dr congo": "cd",
            "democratic republic of the congo": "cd",
            "congo dr": "cd",
            "turkiye": "tr",
            "türkiye": "tr",
            "turkey": "tr",
            "ivory coast": "ci",
            "cote d'ivoire": "ci",
            "cote d ivoire": "ci",
            "côte d'ivoire": "ci",
            "curacao": "cw",
            "curaçao": "cw",
            "new zealand": "nz",
            "saudi arabia": "sa",
            "cape verde": "cv",
            "cabo verde": "cv",
            "england": "gb-eng",
            "scotland": "gb-sct",
            "wales": "gb-wls",
        }
        
        if name_key in aliases:
            return aliases[name_key]
            
        # 3. Fallback search (substring match)
        for name, code in name_to_code.items():
            if name_key in name or name in name_key:
                return code
                
        # 4. Check if team_code is 3-letter code and map it if possible
        fifa_to_iso = {
            "ARG": "ar", "BRA": "br", "FRA": "fr", "GER": "de", "ESP": "es", "POR": "pt",
            "ITA": "it", "ENG": "gb-eng", "SCO": "gb-sct", "WAL": "gb-wls", "NED": "nl",
            "BEL": "be", "CRO": "hr", "URU": "uy", "MEX": "mx", "USA": "us", "CAN": "ca",
            "COL": "co", "SEN": "sn", "MAR": "ma", "JPN": "jp", "KOR": "kr", "POL": "pl",
            "SWE": "se", "DEN": "dk", "SUI": "ch", "AUT": "at", "NGA": "ng", "EGY": "eg",
            "TUN": "tn", "ALG": "dz", "CHI": "cl", "PER": "pe", "ECU": "ec", "PAR": "py",
            "UKR": "ua", "TUR": "tr", "CZE": "cz", "CMR": "cm", "CIV": "ci", "GHA": "gh",
            "CRC": "cr", "QAT": "qa", "IRN": "ir", "IRQ": "iq", "JOR": "jo", "UZB": "uz",
            "PAN": "pa", "RSA": "za", "BIH": "ba", "CUW": "cw", "CPV": "cv", "NZL": "nz",
            "COD": "cd", "JAM": "jm", "HON": "hn",
        }
        
        if team_code and team_code.upper() in fifa_to_iso:
            return fifa_to_iso[team_code.upper()]
            
        logger.warning({
            "message": "Could not map team to Flagpedia code, using unknown fallback",
            "team_name": team_name,
            "team_code": team_code
        })
        return "un"

    def transform_team_data(self, teams, flag_codes=None):
        """
        Transforms team data from API format to DB format.
        - logo_url maps from flag_url fallback to Flagpedia API
        - group maps from group_name
        """
        logger.info({"message": "Starting transform_team_data", "count": len(teams)})
        codes = flag_codes or {}
        name_to_code = {v.lower().strip(): k for k, v in codes.items()}

        transformed_teams = []
        for team in teams:
            team_name = team.get("name", "")
            team_code = team.get("code", "")
            logo_url = team.get("flag_url")
            
            # If API flag_url is empty, fetch dynamically from Flagpedia
            if not logo_url:
                code = self._get_flagpedia_code(name_to_code, team_name, team_code)
                logo_url = f"https://flagcdn.com/w80/{code}.png"
                logger.info({
                    "message": f"Generated Flagpedia logo_url for team {team_name}",
                    "team": team_name,
                    "code": code,
                    "logo_url": logo_url
                })

            transformed_teams.append({
                "name": team_name,
                "code": team_code,
                "logo_url": logo_url,
                "group": team.get("group_name")
            })
            
        logger.info({"message": "Completed transform_team_data", "count": len(transformed_teams)})
        return transformed_teams

    def transform_team_details(self, teams, flag_codes=None):
        """
        Transforms detailed team data (standings) from Sofascore format to DB format.
        """
        logger.info({"message": "Starting transform_team_details", "count": len(teams)})
        codes = flag_codes or {}
        name_to_code = {v.lower().strip(): k for k, v in codes.items()}

        transformed_teams = []
        for team in teams:
            team_name = team.get("name", "")
            team_code = team.get("nameCode", "")
            
            logo_url = team.get("image")
            if logo_url:
                logger.info({
                    "message": f"Using extracted Sofascore logo_url for team detail {team_name}",
                    "team": team_name,
                    "logo_url": logo_url
                })
            else:
                code = self._get_flagpedia_code(name_to_code, team_name, team_code)
                logo_url = f"https://flagcdn.com/w80/{code}.png"
                logger.info({
                    "message": f"Generated Flagpedia logo_url for team detail {team_name}",
                    "team": team_name,
                    "code": code,
                    "logo_url": logo_url
                })

            transformed_teams.append({
                "sofascore_id": team.get("id"),
                "name": team_name,
                "code": team_code,
                "alpha_3_code": team.get("country", {}).get("alpha3"),
                "fifa_ranking": team.get("ranking"),
                "position": team.get("position"),
                "matches_played": team.get("matches_played"),
                "matches_won": team.get("matches_won"),
                "matches_drawn": team.get("matches_drawn"),
                "matches_lost": team.get("matches_lost"),
                "goals_for": team.get("goals_for"),
                "goals_against": team.get("goals_against"),
                "points": team.get("points"),
                "logo_url": logo_url
            })
            
        logger.info({"message": "Completed transform_team_details", "count": len(transformed_teams)})
        return transformed_teams

    def transform_squad_player(self, player_raw, team_code):
        """
        Transforms a player from the squad list (Sofascore) to DB format.
        """
        logger.info({
            "message": "Starting transform_squad_player",
            "player_name": player_raw.get("name"),
            "team_code": team_code
        })
        
        dob = None
        if player_raw.get("dateOfBirthTimestamp"):
            dob = datetime.fromtimestamp(player_raw.get("dateOfBirthTimestamp")).date()

        transformed = {
            "id": player_raw.get("id"),
            "name": player_raw.get("name"),
            "date_of_birth": dob,
            "classification": player_raw.get("position"),
            "club_name": (player_raw.get("team") or {}).get("name"),
            "positions": ", ".join(player_raw.get("positionsDetailed") or []),
            "weight_kg": player_raw.get("weight"),
            "height_cm": player_raw.get("height"),
            "foot": player_raw.get("preferredFoot"),
            "country_code": team_code, # Use the team code passed from the pipeline
            "market_value": player_raw.get("proposedMarketValue"),
            "rating": player_raw.get("rating")
        }
        
        logger.info({
            "message": "Completed transform_squad_player",
            "player_id": transformed["id"],
            "player_name": transformed["name"]
        })
        return transformed
