import unittest

from fastapi.testclient import TestClient

from server.main import app


class TestImageProxyRoute(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_image_proxy_route_redirects_to_backend_image_url(self):
        image_url = "https://img.example.com/player.jpg"

        response = self.client.get(
            f"/image-proxy?url={image_url}",
            follow_redirects=False,
        )

        self.assertEqual(response.status_code, 307)
        self.assertEqual(response.headers["location"], image_url)


if __name__ == "__main__":
    unittest.main()
