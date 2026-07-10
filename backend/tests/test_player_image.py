import asyncio
import unittest
from unittest.mock import AsyncMock, patch

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

    @patch("server.player_image.fetch_image_bytes", new_callable=AsyncMock)
    def test_fetch_player_image_bytes_returns_payload(self, mock_fetch):
        mock_fetch.return_value = (b"image-bytes", "image/png")

        content, content_type = asyncio.run(
            fetch_player_image_bytes("https://img.sofascore.com/api/v1/player/42/image")
        )

        self.assertEqual(content, b"image-bytes")
        self.assertEqual(content_type, "image/png")
        mock_fetch.assert_awaited_once_with(
            "https://img.sofascore.com/api/v1/player/42/image"
        )

    @patch("server.player_image.fetch_image_bytes", new_callable=AsyncMock)
    def test_fetch_player_image_bytes_raises_for_non_success(self, mock_fetch):
        mock_fetch.side_effect = ValueError("upstream_status_403")

        with self.assertRaises(ValueError):
            asyncio.run(
                fetch_player_image_bytes("https://img.sofascore.com/api/v1/player/42/image")
            )
