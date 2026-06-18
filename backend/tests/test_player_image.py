import unittest
from unittest.mock import patch

from server.player_image import (
    build_player_image_api_path,
    fetch_player_image_bytes,
    resolve_player_image_source_url,
)


class TestPlayerImageHelpers(unittest.TestCase):
    def test_build_player_image_api_path(self):
        self.assertEqual(build_player_image_api_path(42), "/players/42/image")

    def test_resolve_player_image_source_url_uses_stored_url(self):
        source = resolve_player_image_source_url(
            42,
            "https://example.com/player.png",
        )
        self.assertEqual(source, "https://example.com/player.png")

    def test_resolve_player_image_source_url_falls_back_to_sofascore(self):
        source = resolve_player_image_source_url(42, None)
        self.assertEqual(source, "https://img.sofascore.com/api/v1/player/42/image")

    @patch("server.player_image.requests.get")
    def test_fetch_player_image_bytes_returns_payload(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.content = b"image-bytes"
        mock_get.return_value.headers = {"Content-Type": "image/png"}

        content, content_type = fetch_player_image_bytes(
            "https://img.sofascore.com/api/v1/player/42/image"
        )

        self.assertEqual(content, b"image-bytes")
        self.assertEqual(content_type, "image/png")
        mock_get.assert_called_once()
        self.assertEqual(
            mock_get.call_args.kwargs["headers"]["Referer"],
            "https://www.sofascore.com/",
        )

    @patch("server.player_image.requests.get")
    def test_fetch_player_image_bytes_raises_for_non_success(self, mock_get):
        mock_get.return_value.status_code = 403
        mock_get.return_value.content = b"forbidden"
        mock_get.return_value.headers = {"Content-Type": "application/json"}

        with self.assertRaises(ValueError):
            fetch_player_image_bytes("https://img.sofascore.com/api/v1/player/42/image")
