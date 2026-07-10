import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from server.main import app


class TestImageProxyRoute(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("server.routes.image_proxy.requests.get")
    def test_image_proxy_route_streams_upstream_image_bytes(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.content = b"image-bytes"
        mock_get.return_value.headers = {"Content-Type": "image/png"}

        image_url = "https://img.sofascore.com/api/v1/player/42/image"
        response = self.client.get(f"/image-proxy?url={image_url}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"image-bytes")
        self.assertEqual(response.headers["content-type"], "image/png")
        mock_get.assert_called_once()
        self.assertEqual(
            mock_get.call_args.kwargs["headers"]["Referer"],
            "https://www.sofascore.com/",
        )

    def test_image_proxy_route_rejects_disallowed_host(self):
        response = self.client.get(
            "/image-proxy?url=https://evil.example.com/player.jpg"
        )

        self.assertEqual(response.status_code, 400)

    def test_image_proxy_route_rejects_invalid_url(self):
        response = self.client.get("/image-proxy?url=not-a-url")

        self.assertEqual(response.status_code, 400)

    @patch("server.routes.image_proxy.requests.get")
    def test_image_proxy_route_returns_404_when_upstream_missing(self, mock_get):
        mock_get.return_value.status_code = 404
        mock_get.return_value.content = b""
        mock_get.return_value.headers = {}

        image_url = "https://img.sofascore.com/api/v1/player/42/image"
        response = self.client.get(f"/image-proxy?url={image_url}")

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
