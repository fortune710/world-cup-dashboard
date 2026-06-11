import os
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pika

from config.settings import Settings
from services.queue_service import QueueService


class TestMatchdayStatsWorker(unittest.TestCase):
    def setUp(self):
        self.queue_payload = {
            "sofascore_id": 555001,
            "id": 501,
            "home_team_code": "KSA",
            "away_team_code": "JPN",
        }
        self.match_row = SimpleNamespace(
            id=501,
            sofascore_id=555001,
            kickoff_utc=datetime(2026, 6, 11, 19, 0, tzinfo=timezone.utc),
            home_team_code="KSA",
            away_team_code="JPN",
        )
        self.lineups = {
            "home": {
                "players": [
                    {
                        "player": {"id": 9001, "position": "F"},
                        "statistics": {
                            "rating": "7.5",
                            "goals": "1",
                            "goalAssist": "1",
                            "accuratePasses": "24",
                            "totalPasses": "32",
                            "bigChancesCreated": "2",
                            "expected_goals": "0.8",
                            "assists": "0",
                            "ratingVersions": {"original": 7.5},
                        },
                    }
                ]
            },
            "away": {
                "players": [
                    {
                        "player": {"id": 9002, "position": "M"},
                        "statistics": {
                            "rating": 6.9,
                            "goals": 0,
                            "accuratePasses": 19,
                            "totalPasses": 30,
                            "bigChancesCreated": 1,
                            "expectedGoals": 0.2,
                            "assists": 1,
                            "statisticsType": {"sportSlug": "football", "statisticsType": "player"},
                        },
                    }
                ]
            },
        }

    def test_run_matchday_stats_batch_processes_queue_message(self):
        from services import matchday_stats_worker

        fake_queue = Mock()
        fake_queue.consume.return_value = [{"body": self.queue_payload, "delivery_tag": 101}]
        fake_db = Mock()

        with patch.object(matchday_stats_worker, "QueueService", return_value=fake_queue), patch.object(
            matchday_stats_worker,
            "SessionLocal",
            return_value=fake_db,
        ), patch.object(matchday_stats_worker, "get_match_by_sofascore_id", return_value=self.match_row), patch.object(
            matchday_stats_worker,
            "replace_matchday_stats_for_match",
            return_value=2,
        ) as replace_rows, patch.object(
            matchday_stats_worker.asyncio,
            "run",
            return_value=self.lineups,
        ):
            result = matchday_stats_worker.run_matchday_stats_batch()

        self.assertEqual(result, {"processed": 1})
        fake_queue.ack.assert_called_once_with(101)
        fake_queue.nack.assert_not_called()
        replace_rows.assert_called_once()

        _, match_id_arg, match_date_arg, rows_arg = replace_rows.call_args[0]
        self.assertEqual(match_id_arg, 555001)
        self.assertEqual(match_date_arg, self.match_row.kickoff_utc)
        self.assertEqual(len(rows_arg), 2)
        self.assertEqual(rows_arg[0]["player_id"], 9001)
        self.assertEqual(rows_arg[0]["statistics"]["rating"], 7.5)
        self.assertEqual(rows_arg[0]["statistics"]["accurate_pass"], 24)
        self.assertEqual(rows_arg[0]["statistics"]["total_pass"], 32)
        self.assertEqual(rows_arg[0]["statistics"]["goal_contributions"], 1)
        self.assertEqual(rows_arg[0]["statistics"]["pass_accuracy"], 75)
        self.assertEqual(rows_arg[0]["statistics"]["expected_goals"], 0.8)
        self.assertEqual(rows_arg[1]["player_id"], 9002)
        self.assertEqual(rows_arg[1]["statistics"]["accurate_pass"], 19)
        self.assertEqual(rows_arg[1]["statistics"]["total_pass"], 30)
        self.assertEqual(rows_arg[1]["statistics"]["field"], "M")
        self.assertEqual(rows_arg[1]["statistics"]["pass_accuracy"], 63)
        self.assertEqual(rows_arg[1]["statistics"]["assists"], 1)
        self.assertNotIn("statistics_type", rows_arg[1]["statistics"])

    def test_run_matchday_stats_batch_nacks_on_fetch_failure(self):
        from services import matchday_stats_worker

        fake_queue = Mock()
        fake_queue.consume.return_value = [{"body": self.queue_payload, "delivery_tag": 202}]
        fake_db = Mock()

        with patch.object(matchday_stats_worker, "QueueService", return_value=fake_queue), patch.object(
            matchday_stats_worker,
            "SessionLocal",
            return_value=fake_db,
        ), patch.object(matchday_stats_worker, "get_match_by_sofascore_id", return_value=self.match_row), patch.object(
            matchday_stats_worker.asyncio,
            "run",
            side_effect=Exception("Sofascore error"),
        ):
            result = matchday_stats_worker.run_matchday_stats_batch()

        self.assertEqual(result, {"processed": 0})
        fake_queue.ack.assert_not_called()
        fake_queue.nack.assert_called_once_with(202, requeue=True)


class TestMatchdayStatsWorkerIntegration(unittest.TestCase):
    def setUp(self):
        self.queue_name = f"test_matchday_stats_worker_{os.getpid()}"
        self.queue_payload = {
            "sofascore_id": 777001,
            "id": 701,
            "home_team_code": "MEX",
            "away_team_code": "RSA",
        }

    def test_run_matchday_stats_batch_consumes_rabbitmq_messages(self):
        from services import matchday_stats_worker

        settings = Settings()
        params = pika.URLParameters(settings.RABBITMQ_URL)
        params.connection_attempts = 1
        params.socket_timeout = 3

        try:
            probe_connection = pika.BlockingConnection(params)
            probe_connection.close()
        except Exception as exc:
            self.skipTest(f"RabbitMQ is unavailable for integration testing: {exc}")

        fake_queue = QueueService()
        try:
            fake_queue.publish(queue_name=self.queue_name, message=self.queue_payload)
            fake_db = Mock()
            match_row = SimpleNamespace(
                id=701,
                sofascore_id=777001,
                kickoff_utc=datetime(2026, 6, 12, 19, 0, tzinfo=timezone.utc),
                home_team_code="MEX",
                away_team_code="RSA",
            )
            lineups = {
                "home": {
                    "players": [
                        {
                            "player": {"id": 7001, "position": "D"},
                            "statistics": {"rating": 6.8, "goals": 0, "accuratePasses": 18, "totalPasses": 36},
                        }
                    ]
                },
                "away": {
                    "players": [
                        {
                            "player": {"id": 7002, "position": "F"},
                            "statistics": {"rating": 7.2, "goals": 1, "assists": 1, "accuratePasses": 12, "totalPasses": 20},
                        }
                    ]
                },
            }

            with patch.object(matchday_stats_worker, "INBOUND_QUEUE", self.queue_name), patch.object(
                matchday_stats_worker,
                "SessionLocal",
                return_value=fake_db,
            ), patch.object(matchday_stats_worker, "get_match_by_sofascore_id", return_value=match_row), patch.object(
                matchday_stats_worker,
                "replace_matchday_stats_for_match",
                return_value=2,
            ) as replace_rows, patch.object(
                matchday_stats_worker.asyncio,
                "run",
                return_value=lineups,
            ):
                result = matchday_stats_worker.run_matchday_stats_batch()

            self.assertEqual(result, {"processed": 1})
            replace_rows.assert_called_once()
        finally:
            fake_queue.close()


if __name__ == "__main__":
    unittest.main()
