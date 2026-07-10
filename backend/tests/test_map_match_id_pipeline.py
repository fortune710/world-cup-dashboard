import importlib
import sys
import types
from unittest.mock import AsyncMock
from datetime import datetime
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import Mock, patch


def load_map_match_id_pipeline_module():
    created_tasks = []

    class FakeChainedObject:
        def __init__(self, *args, **kwargs):
            self.dag_id = kwargs.get("dag_id") or (args[0] if args else None)
            self.task_id = kwargs.get("task_id")
            self.python_callable = kwargs.get("python_callable")
            self.downstream_task_ids = set()
            self.upstream_task_ids = set()
            created_tasks.append(self)

        def __rshift__(self, other):
            self.downstream_task_ids.add(other.task_id)
            other.upstream_task_ids.add(self.task_id)
            return other

        def __lshift__(self, other):
            self.upstream_task_ids.add(other.task_id)
            other.downstream_task_ids.add(self.task_id)
            return other

    fake_modules = {
        "airflow": types.ModuleType("airflow"),
        "airflow.operators": types.ModuleType("airflow.operators"),
        "airflow.operators.python": types.ModuleType("airflow.operators.python"),
        "config.db": types.ModuleType("config.db"),
        "db.controllers.teams": types.ModuleType("db.controllers.teams"),
        "db.controllers.matches": types.ModuleType("db.controllers.matches"),
        "pipeline.load.match_id_mapping": types.ModuleType("pipeline.load.match_id_mapping"),
    }

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
    fake_modules["db.controllers.teams"].get_all_teams = lambda *args, **kwargs: []
    fake_modules["db.controllers.matches"].update_match_sofascore_id = lambda *args, **kwargs: None
    fake_modules["pipeline.load.match_id_mapping"].MatchIdMappingLoader = type("MatchIdMappingLoader", (), {})

    saved_modules = {}
    module_name = "pipeline.orchestration.map_match_id_pipeline"
    saved_modules[module_name] = sys.modules.pop(module_name, None)

    try:
        with patch.dict(sys.modules, fake_modules, clear=False):
            module = importlib.import_module(module_name)
            module._created_tasks_for_test = created_tasks
            return module
    finally:
        saved = saved_modules[module_name]
        if saved is None:
            sys.modules.pop(module_name, None)
        else:
            sys.modules[module_name] = saved


def load_match_id_loader_module():
    fake_modules = {
        "config.db": types.ModuleType("config.db"),
        "db.controllers.matches": types.ModuleType("db.controllers.matches"),
    }
    fake_modules["config.db"].SessionLocal = lambda: None
    fake_modules["db.controllers.matches"].update_match_sofascore_id = lambda *args, **kwargs: None

    saved_modules = {}
    module_name = "pipeline.load.match_id_mapping"
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


class TestMapMatchIdPipelineDAG(TestCase):
    def test_dag_wires_extract_transform_and_load_tasks(self):
        module = load_map_match_id_pipeline_module()
        tasks = {task.task_id: task for task in module._created_tasks_for_test}

        self.assertEqual(tasks["extract_teams"].downstream_task_ids, {"transform_match_ids"})
        self.assertEqual(tasks["extract_fixtures"].downstream_task_ids, {"transform_match_ids"})
        self.assertEqual(tasks["transform_match_ids"].downstream_task_ids, {"load_match_ids"})
        self.assertEqual(tasks["transform_match_ids"].upstream_task_ids, {"extract_teams", "extract_fixtures"})
        self.assertEqual(tasks["load_match_ids"].upstream_task_ids, {"transform_match_ids"})


class TestMapMatchIdPipelineTransform(TestCase):
    def test_transform_match_ids_resolves_team_codes_from_fixture_payload(self):
        module = load_map_match_id_pipeline_module()
        teams = [
            {"name": "Saudi Arabia", "code": "KSA", "sofascore_id": 102},
            {"name": "Japan", "code": "JPN", "sofascore_id": 204},
            {"name": "Brazil", "code": "BRA", "sofascore_id": 300},
        ]
        fixtures = [
            {
                "id": 9001,
                "startTimestamp": 1767225600,
                "roundInfo": {"round": 1},
                "homeTeam": {"id": 102},
                "awayTeam": {"id": 204},
            },
            {
                "id": 9002,
                "startTimestamp": 1767312000,
                "roundInfo": {"round": 1},
                "homeTeam": {"id": 999},
                "awayTeam": {"id": 300},
            },
        ]
        fake_ti = SimpleNamespace(
            xcom_pull=lambda task_ids: teams if task_ids == "extract_teams" else fixtures
        )

        resolved = module.transform_match_ids(ti=fake_ti)

        self.assertEqual(len(resolved), 1)
        self.assertEqual(resolved[0]["sofascore_id"], 9001)
        self.assertEqual(resolved[0]["home_team_code"], "KSA")
        self.assertEqual(resolved[0]["away_team_code"], "JPN")
        self.assertIsInstance(resolved[0]["kickoff_utc"], datetime)


class TestMapMatchIdPipelineExtractFixtures(TestCase):
    def test_fetch_2026_wc_fixtures_skips_rounds_that_return_404(self):
        module = load_map_match_id_pipeline_module()
        fake_api = Mock()
        fake_api.close = AsyncMock()
        fake_league = Mock()
        fake_league.rounds = AsyncMock(return_value={"rounds": [{"round": 4}, {"round": 5}]})
        fake_league.league_fixtures_per_round = AsyncMock(
            side_effect=[
                {
                    "events": [
                        {
                            "id": 9001,
                            "startTimestamp": 1767225600,
                            "homeTeam": {"id": 102},
                            "awayTeam": {"id": 204},
                        }
                    ]
                },
                Exception("Failed to fetch /unique-tournament/16/season/58210/events/round/5: 404"),
            ]
        )
        fake_league.cup_tree = AsyncMock(return_value={"cupTrees": []})

        with patch("sofascore_wrapper.api.SofascoreAPI", return_value=fake_api), patch(
            "sofascore_wrapper.league.League", return_value=fake_league
        ):
            fixtures = module.asyncio.run(module.fetch_2026_wc_fixtures())

        self.assertEqual(len(fixtures), 1)
        self.assertEqual(fixtures[0]["id"], 9001)
        fake_league.rounds.assert_awaited_once()
        self.assertEqual(fake_league.league_fixtures_per_round.await_count, 2)
        fake_league.cup_tree.assert_awaited_once()
        fake_api.close.assert_awaited_once()

    def test_fetch_cup_tree_fixtures_parses_knockout_blocks(self):
        module = load_map_match_id_pipeline_module()
        fake_league = Mock()
        fake_league.cup_tree = AsyncMock(return_value={
            "cupTrees": [
                {
                    "rounds": [
                        {
                            "description": "Round of 32",
                            "blocks": [
                                {
                                    "events": [12813014],
                                    "seriesStartDateTimestamp": 1782765000,
                                    "participants": [
                                        {"order": 1, "team": {"id": 4711, "name": "Germany"}},
                                        {"order": 2, "team": {"id": 4789, "name": "Paraguay"}},
                                    ],
                                },
                                {
                                    # Not yet played / no event id assigned -- should be skipped
                                    "events": [],
                                    "participants": [
                                        {"order": 1, "team": {"id": 1, "name": "TBD A"}},
                                        {"order": 2, "team": {"id": 2, "name": "TBD B"}},
                                    ],
                                },
                            ],
                        },
                        {
                            "description": "Final",
                            "blocks": [
                                {
                                    # Only one participant resolved so far -- should be skipped
                                    "events": [],
                                    "participants": [
                                        {"order": 1, "team": {"id": 4711, "name": "Germany"}},
                                    ],
                                }
                            ],
                        },
                    ]
                }
            ]
        })

        fixtures = module.asyncio.run(module.fetch_cup_tree_fixtures(fake_league, 58210))

        self.assertEqual(len(fixtures), 1)
        fixture = fixtures[0]
        self.assertEqual(fixture["id"], 12813014)
        self.assertEqual(fixture["homeTeam"]["id"], 4711)
        self.assertEqual(fixture["awayTeam"]["id"], 4789)
        self.assertEqual(fixture["startTimestamp"], 1782765000)
        self.assertEqual(fixture["roundInfo"]["name"], "Round of 32")

    def test_fetch_cup_tree_fixtures_returns_empty_on_error(self):
        module = load_map_match_id_pipeline_module()
        fake_league = Mock()
        fake_league.cup_tree = AsyncMock(side_effect=Exception("boom"))

        fixtures = module.asyncio.run(module.fetch_cup_tree_fixtures(fake_league, 58210))

        self.assertEqual(fixtures, [])


class TestMapMatchIdPipelineLoad(TestCase):
    def test_loader_updates_each_resolved_match(self):
        loader_module = load_match_id_loader_module()
        fake_db = Mock()
        resolved_matches = [
            {
                "sofascore_id": 9001,
                "home_team_code": "KSA",
                "away_team_code": "JPN",
                "round": 1,
                "kickoff_utc": datetime(2026, 6, 11, 18, 0, 0),
            },
            {
                "sofascore_id": 9002,
                "home_team_code": "BRA",
                "away_team_code": "ARG",
                "round": 1,
                "kickoff_utc": datetime(2026, 6, 12, 18, 0, 0),
            },
        ]

        with patch.object(loader_module, "SessionLocal", return_value=fake_db), patch.object(
            loader_module,
            "update_match_sofascore_id",
            side_effect=[SimpleNamespace(id=1), None],
        ) as update_match_sofascore_id:
            loader = loader_module.MatchIdMappingLoader()
            result = loader.load_match_ids(resolved_matches)

        self.assertEqual(
            result,
            {
                "updated": 1,
                "skipped": 1,
            },
        )
        self.assertEqual(update_match_sofascore_id.call_count, 2)
        fake_db.close.assert_called_once()
