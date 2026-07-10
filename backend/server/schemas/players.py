from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import date
from db.models.players import PlayerClassification, PlayerFoot

class TeamPlayerResponse(BaseModel):
    id: int
    name: str
    club_name: Optional[str]
    classification: PlayerClassification
    image_url: Optional[str]
    positions: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class PlayerInfoResponse(BaseModel):
    id: int
    name: str
    date_of_birth: Optional[date]
    classification: Optional[PlayerClassification]
    club_name: Optional[str]
    positions: Optional[str]
    weight_kg: Optional[int]
    height_cm: Optional[int]
    foot: Optional[PlayerFoot]
    country_code: str
    market_value: Optional[int]
    image_url: Optional[str]
    rating: Optional[float]

    model_config = ConfigDict(from_attributes=True)

class PlayerStatisticsResponse(BaseModel):
    id: int
    name: str
    statistics: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PlayerTopGoalsResponse(PlayerInfoResponse):
    goals: int


class PlayerTopAssistsResponse(PlayerInfoResponse):
    assists: int


class PlayerTopCleanSheetsResponse(PlayerInfoResponse):
    clean_sheets: int


class PlayerTopSavesResponse(PlayerInfoResponse):
    saves: int


class PlayerLeaderboardStatisticsResponse(BaseModel):
    appearances: int
    minutes_played: int
    clean_sheets: int
    saves: int
    goals: int
    assists: int
    expected_goals: float
    expected_assists: float
    rating: float

    model_config = ConfigDict(from_attributes=True)


class PlayerLeaderboardResponse(BaseModel):
    id: int
    player_name: str
    country_code: str
    classification: Optional[PlayerClassification] = None
    team_image: Optional[str] = None
    group: Optional[str] = None
    image_url: Optional[str] = None
    statistics: PlayerLeaderboardStatisticsResponse

    model_config = ConfigDict(from_attributes=True)


class PlayerSearchResponse(BaseModel):
    id: int
    name: str
    country_code: str
    position: str
    image_url: str

    model_config = ConfigDict(from_attributes=True)


class RadarPeerStatistics(BaseModel):
    goals: Optional[float] = None
    assists: Optional[float] = None
    expected_goals: Optional[float] = None
    expected_assists: Optional[float] = None
    total_shots: Optional[float] = None
    shots_on_target: Optional[float] = None
    big_chances_missed: Optional[float] = None
    successful_dribbles: Optional[float] = None
    accurate_crosses: Optional[float] = None
    key_passes: Optional[float] = None
    accurate_passes: Optional[float] = None
    total_passes: Optional[float] = None
    accurate_passes_percentage: Optional[float] = None
    accurate_long_balls_percentage: Optional[float] = None
    accurate_final_third_passes: Optional[float] = None
    tackles: Optional[float] = None
    tackles_won_percentage: Optional[float] = None
    interceptions: Optional[float] = None
    clearances: Optional[float] = None
    blocked_shots: Optional[float] = None
    aerial_duels_won: Optional[float] = None
    aerial_duels_won_percentage: Optional[float] = None
    saves: Optional[float] = None
    goals_prevented: Optional[float] = None
    clean_sheet: Optional[float] = None
    penalty_save: Optional[float] = None
    penalty_faced: Optional[float] = None
    high_claims: Optional[float] = None
    minutes_played: Optional[float] = None
    rating: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class RadarPeerResponse(BaseModel):
    id: str
    name: str
    radarRole: str
    statistics: RadarPeerStatistics

    model_config = ConfigDict(from_attributes=True)


class RadarPeersListResponse(BaseModel):
    peers: list[RadarPeerResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)


class PlayerMatchHistoryEntry(BaseModel):
    match_id: int
    round: Optional[str] = None
    phase: Optional[str] = None
    kickoff_utc: Optional[str] = None
    opponent: Optional[str] = None
    team_score: Optional[int] = None
    opponent_score: Optional[int] = None
    clean_sheet: Optional[bool] = None
    rating: Optional[float] = None
    minutes_played: Optional[float] = None
    goal_contributions: Optional[float] = None
    tackles: Optional[float] = None
    interceptions: Optional[float] = None
    pass_accuracy: Optional[float] = None
    has_player_stats: bool

    model_config = ConfigDict(from_attributes=True)


class PlayerMatchHistoryResponse(BaseModel):
    matches: list[PlayerMatchHistoryEntry]

    model_config = ConfigDict(from_attributes=True)

