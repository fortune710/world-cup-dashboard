import unittest
from pipeline.transformations.players import PlayersTransformations

class TestStatsTransformation(unittest.TestCase):
    def setUp(self):
        self.transformer = PlayersTransformations()
        self.mock_stats = {
            "statistics": {
                "rating": 7.5,
                "goals": 2,
                "assists": 1,
                "totalPasses": 50,
                "accuratePasses": 45
            }
        }
        self.mock_info = {
            "player": {
                "id": 123,
                "name": "Test Player",
                "dateOfBirthTimestamp": 878256000,
                "position": "F",
                "weight": 75,
                "height": 180,
                "preferredFoot": "Right",
                "country": {"alpha3": "ENG"},
                "proposedMarketValue": 50000000,
                "team": {"name": "Test FC"}
            }
        }

    def test_transform_player_info_with_stats(self):
        result = self.transformer.transform_player_info(self.mock_info, image_url="https://example.com/player.png")
        self.assertEqual(result["id"], 123)
        self.assertEqual(result["name"], "Test Player")
        self.assertEqual(result["image_url"], "https://example.com/player.png")

    def test_transform_player_stats_only(self):
        rating, stats = self.transformer.transform_player_stats(self.mock_stats)
        self.assertEqual(rating, 7.5)
        self.assertEqual(stats["assists"], 1)
        self.assertEqual(stats["total_passes"], 50)
        self.assertEqual(stats["accurate_passes"], 45)
        self.assertNotIn("totalPasses", stats)
        self.assertNotIn("accuratePasses", stats)

    def test_transform_invalid_stats(self):
        rating, stats = self.transformer.transform_player_stats({})
        self.assertIsNone(rating)
        self.assertIsNone(stats)

if __name__ == '__main__':
    unittest.main()
