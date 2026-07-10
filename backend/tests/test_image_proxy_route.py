import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from server.main import app


class TestImageProxyRoute(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("server.routes.image_proxy.fetch_image_bytes", new_callable=AsyncMock)
    def test_image_proxy_route_streams_upstream_image_bytes(self, mock_fetch):
        mock_fetch.return_value = (b"image-bytes", "image/png")

        image_url = "https://img.sofascore.com/api/v1/player/42/image"
        response = self.client.get(f"/image-proxy?url={image_url}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"image-bytes")
        self.assertEqual(response.headers["content-type"], "image/png")
        mock_fetch.assert_awaited_once_with(image_url)

    def test_image_proxy_route_rejects_disallowed_host(self):
        response = self.client.get(
            "/image-proxy?url=https://evil.example.com/player.jpg"
        )

        self.assertEqual(response.status_code, 400)

    def test_image_proxy_route_rejects_invalid_url(self):
        response = self.client.get("/image-proxy?url=not-a-url")

        self.assertEqual(response.status_code, 400)

    @patch("server.routes.image_proxy.fetch_image_bytes", new_callable=AsyncMock)
    def test_image_proxy_route_returns_404_when_upstream_missing(self, mock_fetch):
        mock_fetch.side_effect = ValueError("upstream_status_404")

        image_url = "https://img.sofascore.com/api/v1/player/42/image"
        response = self.client.get(f"/image-proxy?url={image_url}")

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
