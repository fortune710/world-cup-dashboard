import unittest

from fastapi.testclient import TestClient

from server.main import app


class TestCorsConfiguration(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_preflight_allows_any_origin(self):
        response = self.client.options(
            "/health",
            headers={
                "Origin": "http://example.com",
                "Access-Control-Request-Method": "GET",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "*")

    def test_simple_request_allows_any_origin(self):
        response = self.client.get("/health", headers={"Origin": "http://example.com"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "*")


if __name__ == "__main__":
    unittest.main()
