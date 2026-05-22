class TeamsTransformations:
    """
    Transformation layer for World Cup data.
    """

    def transform_team_data(self, teams):
        """
        Transforms team data from API format to DB format.
        - logo_url maps from flag_url
        - group maps from group_name
        """
        transformed_teams = []
        for team in teams:
            transformed_teams.append({
                "id": team.get("id"),
                "name": team.get("name"),
                "code": team.get("code"),
                "logo_url": team.get("flag_url"),
                "group": team.get("group_name")
            })
        return transformed_teams

    def transform_match_data(self, matches):
        """
        Transforms match data from API format to DB format.
        - group maps from group_name
        - Removed redundant or omitted fields
        """
        transformed_matches = []
        for match in matches:
            transformed_matches.append({
                "id": match.get("id"),
                "round": match.get("round"),
                "group": match.get("group_name"),
                "home_team_code": match.get("home_team_code"),
                "away_team_code": match.get("away_team_code"),
                "stadium": match.get("stadium"),
                "kickoff_utc": match.get("kickoff_utc"),
                "status": match.get("status"),
                "phase": match.get("phase"),
                "home_score": match.get("home_score", 0),
                "away_score": match.get("away_score", 0),
                "home_pen": match.get("home_pen"),
                "away_pen": match.get("away_pen")
            })
        return transformed_matches
