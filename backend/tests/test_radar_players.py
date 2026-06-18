import pytest
import logging
from unittest.mock import MagicMock
from types import SimpleNamespace
from fastapi.testclient import TestClient

from config.db import get_db
from server.main import app
from pipeline.transformations.teams import TeamsTransformations

logger = logging.getLogger(__name__)

client = TestClient(app)

def transform_squad_player(raw):
    logger.info("Calling transform_squad_player in test")
    trans = TeamsTransformations()
    player_raw = raw.get("player", raw)
    return trans.transform_squad_player(player_raw, team_code="TEST")

@pytest.fixture
def db_with_test_players():
    mock_db = MagicMock()
    
    mock_players = [
        SimpleNamespace(
            id=1,
            name="Striker Player",
            positions="ST",
            classification="F",
            stats_json={
                "minutes_played": 300,
                "goals": 2,
                "assists": 1,
                "expected_goals": 1.5,
                "expected_assists": 0.5,
            }
        ),
        SimpleNamespace(
            id=2,
            name="Keeper Player",
            positions="GK",
            classification="G",
            stats_json={
                "minutes_played": 500,
                "saves": 10,
                "clean_sheet": 2,
            }
        )
    ]
    
    mock_query = MagicMock()
    mock_db.query.return_value = mock_query
    
    def filter_side_effect(*args, **kwargs):
        arg_str = str(args)
        
        # Determine role from position code
        if "GK" in arg_str:
            role_players = [p for p in mock_players if p.positions == "GK"]
        elif "ST" in arg_str:
            role_players = [p for p in mock_players if p.positions == "ST"]
        else:
            role_players = mock_players
            
        # Determine minutes filter
        min_min = 0
        if "9999" in arg_str:
            min_min = 9999
        else:
            for arg in args:
                if hasattr(arg, "right"):
                    val = getattr(arg.right, "value", None)
                    if val is None:
                        val = getattr(arg.right, "effective_value", None)
                    if isinstance(val, int):
                        min_min = val
                
        # Filter by minutes
        final_players = []
        for p in role_players:
            p_mins = p.stats_json.get("minutes_played", 0)
            if p_mins >= min_min:
                final_players.append(p)
        return MagicMock(all=lambda: final_players)

    mock_query.filter.side_effect = filter_side_effect
    
    logger.info("Setting up mock DB and dependency overrides")
    app.dependency_overrides[get_db] = lambda: mock_db
    yield mock_db
    logger.info("Tearing down dependency override for get_db")
    app.dependency_overrides.pop(get_db, None)

# Test 1: transform_squad_player preserves positionsDetailed

def test_transform_squad_player_preserves_positions_detailed():
    logger.info("Starting test_transform_squad_player_preserves_positions_detailed")
    raw = {
        "player": {
            "id": "123",
            "name": "Test Player",
            "position": "F",
            "positionsDetailed": "ST,LW",
        }
    }
    result = transform_squad_player(raw)
    assert result["classification"] == "F"
    assert result["positions"].replace(" ", "") == "ST,LW"
    logger.info("Finished test_transform_squad_player_preserves_positions_detailed")

def test_transform_squad_player_falls_back_to_position_when_no_detailed():
    logger.info("Starting test_transform_squad_player_falls_back_to_position_when_no_detailed")
    raw = {
        "player": {
            "id": "124",
            "name": "Test Player 2",
            "position": "D",
            # positionsDetailed absent
        }
    }
    result = transform_squad_player(raw)
    assert result["classification"] == "D"
    assert result["positions"] == "D"   # fallback to broad position
    logger.info("Finished test_transform_squad_player_falls_back_to_position_when_no_detailed")

def test_transform_squad_player_handles_missing_position_gracefully():
    logger.info("Starting test_transform_squad_player_handles_missing_position_gracefully")
    raw = {"player": {"id": "125", "name": "Unknown"}}
    result = transform_squad_player(raw)
    assert result["positions"] == ""    # empty string, not an error
    logger.info("Finished test_transform_squad_player_handles_missing_position_gracefully")

# Test 2: radar-peers endpoint

def test_radar_peers_requires_role():
    logger.info("Starting test_radar_peers_requires_role")
    response = client.get("/players/radar-peers")
    assert response.status_code == 422  # unprocessable entity — role is required
    logger.info("Finished test_radar_peers_requires_role")

def test_radar_peers_rejects_unknown_role():
    logger.info("Starting test_radar_peers_rejects_unknown_role")
    response = client.get("/players/radar-peers?role=UNKNOWN")
    assert response.status_code == 422
    logger.info("Finished test_radar_peers_rejects_unknown_role")

def test_radar_peers_returns_correct_schema(db_with_test_players):
    logger.info("Starting test_radar_peers_returns_correct_schema")
    response = client.get("/players/radar-peers?role=ST&min_minutes=0")
    assert response.status_code == 200
    data = response.json()
    assert "peers" in data
    assert "total" in data
    if data["peers"]:
        peer = data["peers"][0]
        assert "id" in peer
        assert "name" in peer
        assert "radarRole" in peer
        assert "statistics" in peer
        assert peer["radarRole"] == "ST"
    logger.info("Finished test_radar_peers_returns_correct_schema")

def test_radar_peers_filters_by_min_minutes(db_with_test_players):
    logger.info("Starting test_radar_peers_filters_by_min_minutes")
    # With high min_minutes, should return fewer or no peers
    response_strict = client.get("/players/radar-peers?role=ST&min_minutes=9999")
    response_loose  = client.get("/players/radar-peers?role=ST&min_minutes=0")
    assert response_strict.status_code == 200
    assert response_loose.status_code == 200
    assert response_strict.json()["total"] <= response_loose.json()["total"]
    logger.info("Finished test_radar_peers_filters_by_min_minutes")

def test_radar_peers_only_returns_correct_role(db_with_test_players):
    logger.info("Starting test_radar_peers_only_returns_correct_role")
    response = client.get("/players/radar-peers?role=GK&min_minutes=0")
    assert response.status_code == 200
    for peer in response.json()["peers"]:
        assert peer["radarRole"] == "GK"
    logger.info("Finished test_radar_peers_only_returns_correct_role")
