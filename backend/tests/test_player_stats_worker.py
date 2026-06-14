import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, Mock, call, patch


def load_player_stats_worker_module():
    fake_celery_app_module = types.ModuleType("services.celery_app")
    fake_celery_app_module.celery_app = types.SimpleNamespace(task=lambda *args, **kwargs: (lambda fn: fn))
    fake_queue_service_module = types.ModuleType("services.queue_service")
    fake_queue_service_module.QueueService = type("QueueService", (), {})
    fake_settings_module = types.ModuleType("config.settings")
    fake_settings_module.Settings = type(
        "Settings",
        (),
        {
            "PLAYER_STATS_UPDATES_QUEUE": "player_stats_updates",
        },
    )
    fake_config_db_module = types.ModuleType("config.db")
    fake_config_db_module.SessionLocal = lambda: None
    fake_players_controller_module = types.ModuleType("db.controllers.players")
    fake_players_controller_module.update_player_stats_batch = lambda *args, **kwargs: None
    fake_players_source_module = types.ModuleType("pipeline.sources.players")
    fake_players_source_module.PlayersSource = type("PlayersSource", (), {})
    fake_players_transform_module = types.ModuleType("pipeline.transformations.players")
    fake_players_transform_module.PlayersTransformations = type("PlayersTransformations", (), {})

    saved_modules = {}
    module_name = "services.player_stats_worker"
    saved_modules[module_name] = sys.modules.pop(module_name, None)
    backend_path = str(Path(__file__).resolve().parents[1])
    path_added = False
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
        path_added = True

    try:
        with patch.dict(
            sys.modules,
            {
                "services.celery_app": fake_celery_app_module,
                "services.queue_service": fake_queue_service_module,
                "config.settings": fake_settings_module,
                "config.db": fake_config_db_module,
                "db.controllers.players": fake_players_controller_module,
                "pipeline.sources.players": fake_players_source_module,
                "pipeline.transformations.players": fake_players_transform_module,
            },
            clear=False,
        ):
            import importlib

            return importlib.import_module(module_name)
    finally:
        if path_added:
            sys.path.remove(backend_path)
        saved = saved_modules[module_name]
        if saved is None:
            sys.modules.pop(module_name, None)
        else:
            sys.modules[module_name] = saved


class TestPlayerStatsWorker(unittest.TestCase):
    def test_run_fetch_stats_batch_batches_db_updates_and_acks_after_commit(self):
        worker = load_player_stats_worker_module()
        inbound_queue = Mock()
        inbound_queue.consume.side_effect = [
            [
                {"body": {"player_id": 539792, "name": "Ronwen Williams"}, "delivery_tag": 1},
                {"body": {"player_id": 559504, "name": "Themba Zwane"}, "delivery_tag": 2},
            ],
            [],
        ]
        fake_source = Mock()
        fake_source.api.close = AsyncMock()
        fake_source.get_player_stats = AsyncMock(
            side_effect=[
                {"statistics": {"rating": 7.2}},
                {"statistics": {"rating": 0}},
            ]
        )
        fake_transformer = Mock()
        fake_transformer.transform_player_stats.side_effect = [
            (7.2, {"rating": 7.2, "goals": 1}),
            (None, {}),
        ]
        fake_db = Mock()

        with patch.object(worker, "QueueService", return_value=inbound_queue), patch.object(
            worker,
            "SessionLocal",
            return_value=fake_db,
        ), patch.object(
            worker,
            "PlayersSource",
            return_value=fake_source,
        ), patch.object(
            worker,
            "PlayersTransformations",
            return_value=fake_transformer,
        ), patch.object(
            worker,
            "update_player_stats_batch",
            return_value={"updated_count": 1, "released_count": 1},
        ) as update_player_stats_batch:
            result = worker.run_fetch_stats_batch()

        self.assertEqual(result, {"processed": 2, "updated": 1, "released": 1, "retried": 0})
        fake_source.get_player_stats.assert_has_awaits([call(539792), call(559504)])
        fake_transformer.transform_player_stats.assert_has_calls(
            [
                call({"statistics": {"rating": 7.2}}),
                call({"statistics": {"rating": 0}}),
            ],
            any_order=False,
        )
        update_player_stats_batch.assert_called_once_with(
            fake_db,
            [{"player_id": 539792, "rating": 7.2, "stats_json": {"rating": 7.2, "goals": 1}}],
            release_player_ids=[559504],
        )
        self.assertEqual(inbound_queue.consume.call_count, 2)
        inbound_queue.consume.assert_has_calls(
            [call("player_stats_updates", count=10), call("player_stats_updates", count=10)]
        )
        self.assertEqual(fake_source.api.close.await_count, 2)
        inbound_queue.ack.assert_has_calls([call(1), call(2)], any_order=False)
        inbound_queue.nack.assert_not_called()
        fake_db.close.assert_called_once()
        inbound_queue.close.assert_called_once()

    def test_run_fetch_stats_batch_treats_404_as_non_retryable_missing_stats(self):
        worker = load_player_stats_worker_module()
        inbound_queue = Mock()
        inbound_queue.consume.side_effect = [
            [{"body": {"player_id": 14990, "name": "Edin Džeko"}, "delivery_tag": 7}],
            [],
        ]
        fake_source = Mock()
        fake_source.api.close = AsyncMock()
        fake_source.get_player_stats = AsyncMock(
            side_effect=Exception("Failed to fetch /player/14990/unique-tournament/16/season/58210/statistics/overall: 404")
        )
        fake_transformer = Mock()
        fake_db = Mock()

        with patch.object(worker, "QueueService", return_value=inbound_queue), patch.object(
            worker,
            "SessionLocal",
            return_value=fake_db,
        ), patch.object(
            worker,
            "PlayersSource",
            return_value=fake_source,
        ), patch.object(
            worker,
            "PlayersTransformations",
            return_value=fake_transformer,
        ), patch.object(
            worker,
            "update_player_stats_batch",
            return_value={"updated_count": 0, "released_count": 1},
        ) as update_player_stats_batch:
            result = worker.run_fetch_stats_batch()

        self.assertEqual(result, {"processed": 1, "updated": 0, "released": 1, "retried": 0})
        fake_source.get_player_stats.assert_awaited_once_with(14990)
        fake_source.api.close.assert_awaited_once()
        fake_transformer.transform_player_stats.assert_not_called()
        update_player_stats_batch.assert_called_once_with(fake_db, [], release_player_ids=[14990])
        inbound_queue.ack.assert_called_once_with(7)
        inbound_queue.nack.assert_not_called()
        fake_db.close.assert_called_once()
        inbound_queue.close.assert_called_once()

    def test_run_fetch_stats_batch_treats_timeout_as_non_retryable_missing_stats(self):
        worker = load_player_stats_worker_module()
        inbound_queue = Mock()
        inbound_queue.consume.side_effect = [
            [{"body": {"player_id": 259803, "name": "Haris Tabaković"}, "delivery_tag": 9}],
            [],
        ]
        fake_source = Mock()
        fake_source.api.close = AsyncMock()
        fake_source.get_player_stats = AsyncMock(side_effect=TimeoutError("operation timed out"))
        fake_transformer = Mock()
        fake_db = Mock()

        with patch.object(worker, "QueueService", return_value=inbound_queue), patch.object(
            worker,
            "SessionLocal",
            return_value=fake_db,
        ), patch.object(
            worker,
            "PlayersSource",
            return_value=fake_source,
        ), patch.object(
            worker,
            "PlayersTransformations",
            return_value=fake_transformer,
        ), patch.object(
            worker,
            "update_player_stats_batch",
            return_value={"updated_count": 0, "released_count": 1},
        ) as update_player_stats_batch:
            result = worker.run_fetch_stats_batch()

        self.assertEqual(result, {"processed": 1, "updated": 0, "released": 0, "retried": 1})
        fake_source.get_player_stats.assert_awaited_once_with(259803)
        fake_source.api.close.assert_awaited_once()
        fake_transformer.transform_player_stats.assert_not_called()
        update_player_stats_batch.assert_not_called()
        inbound_queue.ack.assert_not_called()
        inbound_queue.nack.assert_called_once_with(9, requeue=True)
        fake_db.close.assert_called_once()
        inbound_queue.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
