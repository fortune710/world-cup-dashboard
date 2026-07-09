from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from server.schemas.matches import TeamInfo


class BracketMatchResponse(BaseModel):
    """Bracket match payload trimmed to the fields the frontend consumes."""

    id: int
    round: str
    home_team_code: str
    away_team_code: str
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    home_pen: Optional[int] = None
    away_pen: Optional[int] = None
    home_team: TeamInfo
    away_team: TeamInfo
    model_config = ConfigDict(from_attributes=True)


class RoundBracketResponse(BaseModel):
    round: str
    matches: List[BracketMatchResponse]
    model_config = ConfigDict(from_attributes=True)


class BracketResponse(BaseModel):
    rounds: List[RoundBracketResponse]
