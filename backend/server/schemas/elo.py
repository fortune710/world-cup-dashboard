from pydantic import BaseModel, ConfigDict


class EloRankingResponse(BaseModel):
    rank: int
    team_code: str
    team_name: str | None
    elo_rating: float

    model_config = ConfigDict(from_attributes=True)


class TeamEloHistoryResponse(BaseModel):
    match_id: int
    team_code: str
    opponent_code: str
    rating_before: float
    rating_after: float
    rating_delta: float
    expected_score: float
    actual_score: float
    stage_weight: float
    margin_multiplier: float

    model_config = ConfigDict(from_attributes=True)
