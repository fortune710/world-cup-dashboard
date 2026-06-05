from datetime import datetime

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
                "name": team.get("name"),
                "code": team.get("code"),
                "logo_url": team.get("flag_url"),
                "group": team.get("group_name")
            })
        return transformed_teams

    def transform_team_details(self, teams):
        """
        Transforms detailed team data (standings) from Sofascore format to DB format.
        """
        transformed_teams = []
        for team in teams:
            transformed_teams.append({
                "sofascore_id": team.get("id"),
                "name": team.get("name"),
                "code": team.get("nameCode"),
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
                "logo_url": team.get("image")
            })
        return transformed_teams

    def transform_squad_player(self, player_raw, team_code, image_url=None):
        """
        Transforms a player from the squad list (Sofascore) to DB format.
        """
        
        dob = None
        if player_raw.get("dateOfBirthTimestamp"):
            dob = datetime.fromtimestamp(player_raw.get("dateOfBirthTimestamp")).date()

        return {
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
            "rating": player_raw.get("rating"),
            "image_url": image_url or player_raw.get("image_url")
        }
