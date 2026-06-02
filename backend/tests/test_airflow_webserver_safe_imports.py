import builtins
import importlib
import types
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


class TestAirflowWebserverSafeImports(unittest.TestCase):
    def test_dag_modules_import_without_sofascore_wrapper(self):
        backend_root = Path(__file__).resolve().parents[1]
        if str(backend_root) not in sys.path:
            sys.path.insert(0, str(backend_root))

        modules = [
            "pipeline.orchestration.teams_pipeline",
            "pipeline.orchestration.team_details_pipeline",
            "pipeline.orchestration.player_info_pipeline",
        ]
        blocked_prefixes = ("sofascore_wrapper",)
        original_import = builtins.__import__

        def blocked_import(name, globals=None, locals=None, fromlist=(), level=0):
            if name.startswith(blocked_prefixes):
                raise ModuleNotFoundError(f"No module named '{name}'")
            return original_import(name, globals, locals, fromlist, level)

        fake_modules = {
            "airflow": types.ModuleType("airflow"),
            "airflow.operators": types.ModuleType("airflow.operators"),
            "airflow.operators.python": types.ModuleType("airflow.operators.python"),
            "airflow.sensors": types.ModuleType("airflow.sensors"),
            "airflow.sensors.external_task": types.ModuleType("airflow.sensors.external_task"),
            "config.db": types.ModuleType("config.db"),
            "dotenv": types.ModuleType("dotenv"),
            "db.controllers.teams": types.ModuleType("db.controllers.teams"),
            "db.controllers.players": types.ModuleType("db.controllers.players"),
            "db.controllers.matches": types.ModuleType("db.controllers.matches"),
            "requests": types.ModuleType("requests"),
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
        fake_modules["airflow.operators.python"].PythonOperator = type(
            "FakePythonOperator",
            (FakeChainedObject,),
            {},
        )
        fake_modules["airflow.sensors.external_task"].ExternalTaskSensor = type(
            "FakeExternalTaskSensor",
            (FakeChainedObject,),
            {},
        )
        fake_modules["config.db"].SessionLocal = lambda: None
        fake_modules["dotenv"].load_dotenv = lambda *args, **kwargs: None
        fake_modules["db.controllers.teams"].get_next_team_to_index = lambda *args, **kwargs: None
        fake_modules["db.controllers.teams"].mark_team_as_indexed = lambda *args, **kwargs: None
        fake_modules["db.controllers.players"].upsert_player = lambda *args, **kwargs: None
        fake_modules["db.controllers.players"].upsert_players = lambda *args, **kwargs: 0
        fake_modules["db.controllers.players"].get_players_by_team = lambda *args, **kwargs: []
        fake_modules["db.controllers.matches"].upsert_match = lambda *args, **kwargs: None
        fake_modules["requests"].get = lambda *args, **kwargs: None

        saved_modules = {}
        for module_name in modules:
            saved_modules[module_name] = sys.modules.pop(module_name, None)
        for module_name in list(sys.modules):
            if module_name.startswith("sofascore_wrapper"):
                saved_modules[module_name] = sys.modules.pop(module_name, None)

        try:
            with patch.dict(sys.modules, fake_modules, clear=False):
                with patch("builtins.__import__", side_effect=blocked_import):
                    for module_name in modules:
                        importlib.import_module(module_name)
        finally:
            for module_name, module in saved_modules.items():
                if module is None:
                    sys.modules.pop(module_name, None)
                else:
                    sys.modules[module_name] = module


if __name__ == "__main__":
    unittest.main()
