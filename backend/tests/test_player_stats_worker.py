import sys
import types
import unittest
from unittest.mock import AsyncMock, Mock, patch


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
            "PLAYER_STATS_DB_UPDATES_QUEUE": "player_stats_db_updates",
        },
    )
    fake_players_source_module = types.ModuleType("pipeline.sources.players")
    fake_players_source_module.PlayersSource = type("PlayersSource", (), {})
    fake_players_transform_module = types.ModuleType("pipeline.transformations.players")
    fake_players_transform_module.PlayersTransformations = type("PlayersTransformations", (), {})

    saved_modules = {}
    module_name = "services.player_stats_worker"
    saved_modules[module_name] = sys.modules.pop(module_name, None)

    try:
        with patch.dict(
            sys.modules,
            {
                "services.celery_app": fake_celery_app_module,
                "services.queue_service": fake_queue_service_module,
                "config.settings": fake_settings_module,
                "pipeline.sources.players": fake_players_source_module,
                "pipeline.transformations.players": fake_players_transform_module,
            },
            clear=False,
        ):
            import importlib

            return importlib.import_module(module_name)
    finally:
        saved = saved_modules[module_name]
        if saved is None:
            sys.modules.pop(module_name, None)
        else:
            sys.modules[module_name] = saved


class TestPlayerStatsWorker(unittest.TestCase):
    def test_run_fetch_stats_batch_awaits_async_player_stats_and_publishes_result(self):
        worker = load_player_stats_worker_module()
        fake_queue = Mock()
        fake_queue.consume.return_value = [
            {"body": {"player_id": 539792, "name": "Ronwen Williams"}, "delivery_tag": 1}
        ]
        fake_source = Mock()
        fake_source.get_player_stats = AsyncMock(return_value={"statistics": {"rating": 7.2}})
        fake_transformer = Mock()
        fake_transformer.transform_player_stats.return_value = (7.2, {"rating": 7.2})

        with patch.object(worker, "QueueService", return_value=fake_queue), patch.object(
            worker,
            "PlayersSource",
            return_value=fake_source,
        ), patch.object(worker, "PlayersTransformations", return_value=fake_transformer):
            result = worker.run_fetch_stats_batch()

        self.assertEqual(result, {"processed": 1})
        fake_source.get_player_stats.assert_awaited_once_with(539792)
        fake_transformer.transform_player_stats.assert_called_once_with({"statistics": {"rating": 7.2}})
        fake_queue.publish.assert_called_once()
        fake_queue.ack.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
