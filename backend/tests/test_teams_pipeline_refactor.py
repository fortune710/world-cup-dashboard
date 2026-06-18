import unittest
import logging
from unittest.mock import patch, MagicMock
from pipeline.sources.teams import TeamsSource
from pipeline.transformations.teams import TeamsTransformations

logger = logging.getLogger(__name__)

class TestTeamsSourceRefactor(unittest.TestCase):
    @patch("pipeline.sources.teams.requests.get")
    def test_get_flagpedia_codes_success(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.json.return_value = {"es": "Spain", "us": "United States"}
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        # Act
        source = TeamsSource()
        codes = source.get_flagpedia_codes()

        # Assert
        self.assertEqual(codes, {"es": "Spain", "us": "United States"})
        mock_get.assert_called_once_with("https://flagcdn.com/en/codes.json", timeout=10)

    @patch("pipeline.sources.teams.requests.get")
    def test_get_flagpedia_codes_failure(self, mock_get):
        # Arrange
        mock_get.side_effect = Exception("API error")

        # Act
        source = TeamsSource()
        codes = source.get_flagpedia_codes()

        # Assert
        self.assertEqual(codes, {})


class TestTeamsTransformationsRefactor(unittest.TestCase):
    def setUp(self):
        self.transformations = TeamsTransformations()
        self.mock_flag_codes = {"es": "Spain", "us": "United States"}

    def test_transform_team_data_with_provided_codes(self):
        # Arrange
        raw_teams = [
            {"name": "Spain", "code": "ESP", "flag_url": None, "group_name": "Group A"},
            {"name": "United States", "code": "USA", "flag_url": "https://custom.com/us.png", "group_name": "Group B"}
        ]

        # Act
        transformed = self.transformations.transform_team_data(raw_teams, self.mock_flag_codes)

        # Assert
        self.assertEqual(len(transformed), 2)
        self.assertEqual(transformed[0]["logo_url"], "https://flagcdn.com/w80/es.png")
        self.assertEqual(transformed[1]["logo_url"], "https://custom.com/us.png")

    def test_transform_team_details_with_provided_codes(self):
        # Arrange
        raw_details = [
            {
                "id": 1,
                "name": "Spain",
                "nameCode": "ESP",
                "image": None,
                "country": {"alpha3": "ESP"},
                "ranking": 3,
                "position": 1,
                "matches": 3,
                "wins": 2,
                "draws": 1,
                "losses": 0,
                "scoresFor": 6,
                "scoresAgainst": 1,
                "points": 7
            }
        ]

        # Act
        transformed = self.transformations.transform_team_details(raw_details, self.mock_flag_codes)

        # Assert
        self.assertEqual(len(transformed), 1)
        self.assertEqual(transformed[0]["logo_url"], "https://flagcdn.com/w80/es.png")

    def test_transform_team_details_with_provided_image(self):
        # Arrange
        raw_details = [
            {
                "id": 1,
                "name": "Spain",
                "nameCode": "ESP",
                "image": "https://sofascore.com/team-image.png",
                "country": {"alpha3": "ESP"},
                "ranking": 3,
                "position": 1,
                "matches": 3,
                "wins": 2,
                "draws": 1,
                "losses": 0,
                "scoresFor": 6,
                "scoresAgainst": 1,
                "points": 7
            }
        ]

        # Act
        transformed = self.transformations.transform_team_details(raw_details, self.mock_flag_codes)

        # Assert
        self.assertEqual(len(transformed), 1)
        self.assertEqual(transformed[0]["logo_url"], "https://sofascore.com/team-image.png")

    def test_transform_squad_player(self):
        logger.info("Starting test_transform_squad_player")
        # 1. Test positionsDetailed as list
        logger.debug("Scenario 1: positionsDetailed as list")
        player_list = {
            "id": 999,
            "name": "Squad Player List",
            "dateOfBirthTimestamp": 878256000,
            "position": "F",
            "positionsDetailed": ["ST", "LW"],
            "weight": 78,
            "height": 185,
            "preferredFoot": "Right",
            "proposedMarketValue": 45000000,
            "rating": 7.2,
            "image_url": "https://example.com/p1.png"
        }
        res_list = self.transformations.transform_squad_player(player_list, "ESP")
        self.assertEqual(res_list["positions"], "ST, LW")
        logger.debug("Passed Scenario 1")

        # 2. Test positionsDetailed as string
        logger.debug("Scenario 2: positionsDetailed as string")
        player_str = {
            "id": 998,
            "name": "Squad Player Str",
            "position": "D",
            "positionsDetailed": "CB, RB"
        }
        res_str = self.transformations.transform_squad_player(player_str, "ESP")
        self.assertEqual(res_str["positions"], "CB, RB")
        logger.debug("Passed Scenario 2")

        # 3. Test fallback
        logger.debug("Scenario 3: fallback to simple position")
        player_fallback = {
            "id": 997,
            "name": "Squad Player Fallback",
            "position": "M"
        }
        res_fallback = self.transformations.transform_squad_player(player_fallback, "ESP")
        self.assertEqual(res_fallback["positions"], "M")
        logger.debug("Passed Scenario 3")
        logger.info("Finished test_transform_squad_player")

