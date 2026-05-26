import requests
import os

class MatchesSource:
    """
    Source class for fetching World Cup 2026 matches from the API.
    """
    
    BASE_URL = "https://api.wc2026api.com"
    # Using the API key from teams.py if available or env
    API_KEY = os.getenv("WC2026_API_KEY")

    def get_matches(self):
        """
        Fetches all matches from the API.
        Fields returned:
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
            - kickoff_utc (string)
            - status (string)
            - phase (string, nullable)
            - home_score (int)
            - away_score (int)
            - home_pen (int, nullable)
            - away_pen (int, nullable)
        """
        headers = {"Authorization": f"Bearer {self.API_KEY}"}
        response = requests.get(f"{self.BASE_URL}/matches", headers=headers)
        response.raise_for_status()
        return response.json()
