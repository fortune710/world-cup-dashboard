import unittest
from unittest.mock import patch, MagicMock
from pipeline.sources.teams import TeamsSource
from pipeline.transformations.teams import TeamsTransformations

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
