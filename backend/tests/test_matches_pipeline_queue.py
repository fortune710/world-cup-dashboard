import json
import importlib
import os
import sys
import types
from enum import Enum
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import Mock, patch

import pika

from config.settings import Settings
from services.queue_service import QueueService


def load_matches_pipeline_module():
    fake_modules = {
        "airflow": types.ModuleType("airflow"),
        "airflow.operators": types.ModuleType("airflow.operators"),
        "airflow.operators.python": types.ModuleType("airflow.operators.python"),
        "config.db": types.ModuleType("config.db"),
        "db.controllers.elo": types.ModuleType("db.controllers.elo"),
        "db.controllers.matches": types.ModuleType("db.controllers.matches"),
        "db.controllers.players": types.ModuleType("db.controllers.players"),
        "pipeline.sources.matches": types.ModuleType("pipeline.sources.matches"),
        "pipeline.transformations.matches": types.ModuleType("pipeline.transformations.matches"),
        "pipeline.load.matches": types.ModuleType("pipeline.load.matches"),
        "pipeline.load.elo": types.ModuleType("pipeline.load.elo"),
    }

    class FakeChainedObject:
        def __init__(self, *args, **kwargs):
            pass

        def __rshift__(self, other):
            return other

        def __lshift__(self, other):
            return other

    fake_modules["airflow"].DAG = type(
        "FakeDAG",
        (FakeChainedObject,),
        {
            "__enter__": lambda self: self,
            "__exit__": lambda self, exc_type, exc, tb: False,
        },
    )
    fake_modules["airflow.operators.python"].PythonOperator = type("FakePythonOperator", (FakeChainedObject,), {})
    fake_modules["config.db"].SessionLocal = lambda: None
    fake_modules["db.controllers.elo"].get_elo_inputs = lambda *args, **kwargs: ([], [])
    fake_modules["db.controllers.elo"].replace_elo_ratings = lambda *args, **kwargs: 0
    fake_modules["db.controllers.matches"].get_matches_for_matchday_stats_queue = lambda *args, **kwargs: []
    fake_modules["db.controllers.players"].get_players_by_team = lambda *args, **kwargs: []
    fake_modules["pipeline.sources.matches"].MatchesSource = type("MatchesSource", (), {})
    fake_modules["pipeline.transformations.matches"].MatchesTransformations = type(
        "MatchesTransformations",
        (),
        {},
    )
    fake_modules["pipeline.load.matches"].MatchesLoader = type("MatchesLoader", (), {})
    fake_modules["pipeline.load.elo"].EloLoader = type("EloLoader", (), {})

    saved_modules = {}
    module_name = "pipeline.orchestration.matches_pipeline"
    saved_modules[module_name] = sys.modules.pop(module_name, None)

    try:
        with patch.dict(sys.modules, fake_modules, clear=False):
            return importlib.import_module(module_name)
    finally:
        saved = saved_modules[module_name]
        if saved is None:
            sys.modules.pop(module_name, None)
        else:
            sys.modules[module_name] = saved


class TestMatchesPipelineQueueUnit(TestCase):
    def setUp(self):
        self.completed_match = {
            "id": 1,
            "status": "completed",
            "sofascore_id": 101,
            "home_team_code": "KSA",
            "away_team_code": "JPN",
        }
        self.live_match = {
            "id": 3,
            "status": "live",
            "sofascore_id": 103,
            "home_team_code": "MEX",
            "away_team_code": "RSA",
        }
        self.scheduled_match = {
            "id": 2,
            "status": "scheduled",
            "sofascore_id": 102,
            "home_team_code": "BRA",
            "away_team_code": "ARG",
        }
        self.transformed_matches = [self.completed_match, self.live_match, self.scheduled_match]
        self.fake_ti = SimpleNamespace(
            xcom_pull=lambda task_ids: self.transformed_matches if task_ids == "transform_matches" else None
        )

    def test_enqueue_player_stats_publishes_players_for_completed_matches(self):
        matches_pipeline = load_matches_pipeline_module()
        fake_db = Mock()
        fake_queue = Mock()

        with patch.object(matches_pipeline, "SessionLocal", return_value=fake_db), patch.object(
            matches_pipeline,
            "get_players_by_team",
            side_effect=lambda _db, team_code: {
                "KSA": [SimpleNamespace(id=10, name="Saudi One"), SimpleNamespace(id=11, name="Saudi Two")],
                "JPN": [SimpleNamespace(id=20, name="Japan One")],
            }.get(team_code, []),
        ), patch("services.queue_service.QueueService", return_value=fake_queue), patch.object(
            Settings, "PLAYER_STATS_UPDATES_QUEUE", "unit_test_player_stats_updates"
        ):
            matches_pipeline.enqueue_player_stats(ti=self.fake_ti)

        published_messages = {
            (call.kwargs["queue_name"], call.kwargs["message"]["player_id"], call.kwargs["message"]["name"])
            for call in fake_queue.publish.call_args_list
        }

        self.assertEqual(
            published_messages,
            {
                ("unit_test_player_stats_updates", 10, "Saudi One"),
                ("unit_test_player_stats_updates", 11, "Saudi Two"),
                ("unit_test_player_stats_updates", 20, "Japan One"),
            },
        )
        fake_db.close.assert_called_once()
        fake_queue.close.assert_called_once()

    def test_enqueue_player_stats_skips_non_completed_matches(self):
        matches_pipeline = load_matches_pipeline_module()
        fake_db = Mock()
        fake_queue = Mock()
        fake_ti = SimpleNamespace(
            xcom_pull=lambda task_ids: [self.scheduled_match] if task_ids == "transform_matches" else None
        )

        with patch.object(matches_pipeline, "SessionLocal", return_value=fake_db), patch.object(
            matches_pipeline, "get_players_by_team"
        ) as get_players_by_team, patch("services.queue_service.QueueService", return_value=fake_queue), patch.object(
            Settings, "PLAYER_STATS_UPDATES_QUEUE", "unit_test_player_stats_updates"
        ):
            matches_pipeline.enqueue_player_stats(ti=fake_ti)

        get_players_by_team.assert_not_called()
        fake_queue.publish.assert_not_called()
        fake_db.close.assert_not_called()
        fake_queue.close.assert_not_called()

    def test_enqueue_matchday_stats_publishes_live_and_completed_matches(self):
        matches_pipeline = load_matches_pipeline_module()
        fake_db = Mock()
        fake_queue = Mock()
        fake_matches = [
            SimpleNamespace(
                id=11,
                sofascore_id=111,
                status="live",
                home_team_code="KSA",
                away_team_code="JPN",
            ),
            SimpleNamespace(
                id=12,
                sofascore_id=112,
                status="completed",
                home_team_code="MEX",
                away_team_code="RSA",
            ),
            SimpleNamespace(
                id=13,
                sofascore_id=None,
                status="completed",
                home_team_code="BRA",
                away_team_code="ARG",
            ),
        ]

        with patch.object(matches_pipeline, "SessionLocal", return_value=fake_db), patch.object(
            matches_pipeline,
            "get_matches_for_matchday_stats_queue",
            return_value=fake_matches,
        ), patch("services.queue_service.QueueService", return_value=fake_queue), patch.object(
            Settings, "MATCHDAY_STATS_QUEUE", "unit_test_matchday_stats"
        ):
            matches_pipeline.enqueue_matchday_stats(ti=self.fake_ti)

        published_messages = {
            (
                call.kwargs["queue_name"],
                call.kwargs["message"]["sofascore_id"],
                call.kwargs["message"]["id"],
                call.kwargs["message"]["home_team_code"],
                call.kwargs["message"]["away_team_code"],
            )
            for call in fake_queue.publish.call_args_list
        }

        self.assertEqual(
            published_messages,
            {
                ("unit_test_matchday_stats", 111, 11, "KSA", "JPN"),
                ("unit_test_matchday_stats", 112, 12, "MEX", "RSA"),
            },
        )
        fake_db.close.assert_called_once()
        fake_queue.close.assert_called_once()

    def test_enqueue_matchday_stats_skips_scheduled_matches(self):
        matches_pipeline = load_matches_pipeline_module()
        fake_db = Mock()
        fake_queue = Mock()
        fake_matches = []

        with patch.object(matches_pipeline, "SessionLocal", return_value=fake_db), patch.object(
            matches_pipeline,
            "get_matches_for_matchday_stats_queue",
            return_value=fake_matches,
        ), patch("services.queue_service.QueueService", return_value=fake_queue), patch.object(
            Settings, "MATCHDAY_STATS_QUEUE", "unit_test_matchday_stats"
        ):
            matches_pipeline.enqueue_matchday_stats(ti=self.fake_ti)

        fake_queue.publish.assert_not_called()
        fake_db.close.assert_called_once()
        fake_queue.close.assert_called_once()

    def test_extract_elo_inputs_serializes_match_status_for_xcom(self):
        matches_pipeline = load_matches_pipeline_module()
        fake_db = Mock()
        class FakeMatchStatus(Enum):
            COMPLETED = "completed"

        fake_teams = [SimpleNamespace(code="ARG", elo_rating=1600.0)]
        fake_matches = [
            SimpleNamespace(
                id=21,
                round="group",
                home_team_code="ARG",
                away_team_code="BRA",
                kickoff_utc=None,
                status=FakeMatchStatus.COMPLETED,
                home_score=2,
                away_score=1,
                home_pen=None,
                away_pen=None,
            )
        ]

        with patch.object(matches_pipeline, "SessionLocal", return_value=fake_db), patch.object(
            matches_pipeline,
            "get_elo_inputs",
            return_value=(fake_teams, fake_matches),
        ):
            result = matches_pipeline.extract_elo_inputs()

        self.assertEqual(result["matches"][0]["status"], "completed")
        json.dumps(result)
        fake_db.close.assert_called_once()


class TestMatchesPipelineQueueIntegration(TestCase):
    def setUp(self):
        self.queue_name = f"test_matchday_stats_updates_{os.getpid()}"
        self.completed_match = {
            "id": 99,
            "status": "completed",
            "sofascore_id": 199,
            "home_team_code": "KSA",
            "away_team_code": "JPN",
        }
        self.fake_ti = SimpleNamespace(
            xcom_pull=lambda task_ids: [self.completed_match] if task_ids == "transform_matches" else None
        )

    def test_enqueue_player_stats_writes_messages_to_rabbitmq(self):
        settings = Settings()
        params = pika.URLParameters(settings.RABBITMQ_URL)
        params.connection_attempts = 1
        params.socket_timeout = 3

        try:
            probe_connection = pika.BlockingConnection(params)
            probe_connection.close()
        except Exception as exc:
            self.skipTest(f"RabbitMQ is unavailable for integration testing: {exc}")

        fake_db = Mock()
        fake_players = {
            "KSA": [SimpleNamespace(id=201, name="KSA Player 1"), SimpleNamespace(id=202, name="KSA Player 2")],
            "JPN": [SimpleNamespace(id=301, name="JPN Player 1")],
        }

        queue_service = QueueService()
        try:
            matches_pipeline = load_matches_pipeline_module()
            with patch.object(matches_pipeline, "SessionLocal", return_value=fake_db), patch.object(
                matches_pipeline,
                "get_players_by_team",
                side_effect=lambda _db, team_code: fake_players.get(team_code, []),
            ), patch.object(Settings, "PLAYER_STATS_UPDATES_QUEUE", self.queue_name):
                matches_pipeline.enqueue_player_stats(ti=self.fake_ti)

            messages = queue_service.consume(self.queue_name, count=10)
            payloads = {
                (message["body"]["player_id"], message["body"]["name"])
                for message in messages
            }

            self.assertEqual(
                payloads,
                {
                    (201, "KSA Player 1"),
                    (202, "KSA Player 2"),
                    (301, "JPN Player 1"),
                },
            )

            for message in messages:
                queue_service.ack(message["delivery_tag"])
        finally:
            queue_service.close()

    def test_enqueue_matchday_stats_writes_messages_to_rabbitmq(self):
        settings = Settings()
        params = pika.URLParameters(settings.RABBITMQ_URL)
        params.connection_attempts = 1
        params.socket_timeout = 3

        try:
            probe_connection = pika.BlockingConnection(params)
            probe_connection.close()
        except Exception as exc:
            self.skipTest(f"RabbitMQ is unavailable for integration testing: {exc}")

        fake_db = Mock()
        queue_service = QueueService()
        try:
            matches_pipeline = load_matches_pipeline_module()
            fake_matches = [
                SimpleNamespace(id=991, sofascore_id=1991, status="live", home_team_code="KSA", away_team_code="JPN"),
                SimpleNamespace(id=992, sofascore_id=1992, status="completed", home_team_code="MEX", away_team_code="RSA"),
            ]
            with patch.object(matches_pipeline, "SessionLocal", return_value=fake_db), patch.object(
                matches_pipeline,
                "get_matches_for_matchday_stats_queue",
                return_value=fake_matches,
            ), patch.object(Settings, "MATCHDAY_STATS_QUEUE", self.queue_name):
                matches_pipeline.enqueue_matchday_stats(ti=self.fake_ti)

            messages = queue_service.consume(self.queue_name, count=10)
            payloads = {
                (
                    message["body"]["sofascore_id"],
                    message["body"]["id"],
                    message["body"]["home_team_code"],
                    message["body"]["away_team_code"],
                )
                for message in messages
            }

            self.assertEqual(
                payloads,
                {
                    (1991, 991, "KSA", "JPN"),
                    (1992, 992, "MEX", "RSA"),
                },
            )

            for message in messages:
                queue_service.ack(message["delivery_tag"])
        finally:
            queue_service.close()


if __name__ == "__main__":
    import unittest

    unittest.main()
