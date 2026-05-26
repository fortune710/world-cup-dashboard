class MatchesTransformations:
    """
    Transformation layer for World Cup matches data.
    """

    def transform_match_data(self, matches):
        """
        Transforms match data from API format to DB format.
        - Maps group_name to group
        - Removes fields deprecated in the DB schema
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
