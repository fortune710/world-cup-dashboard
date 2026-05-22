import requests

class TeamsSource:
    """
    Source class for fetching World Cup 2026 data from the API.
    API Documentation: https://api.wc2026api.com/docs/json
    """
    
    BASE_URL = "https://api.wc2026api.com"

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
        response = requests.get(f"{self.BASE_URL}/teams")
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
