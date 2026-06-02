from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TeamInfo(BaseModel):
    name: str
    code: str
    model_config = ConfigDict(from_attributes=True)

class MatchBase(BaseModel):
    round: str
    group: Optional[str] = None
    home_team_code: str
    away_team_code: str
    stadium: str
    kickoff_utc: datetime
    status: str
    phase: Optional[str] = None
    home_score: int
    away_score: int
    home_pen: Optional[int] = None
    away_pen: Optional[int] = None

class MatchResponse(MatchBase):
    id: int
    home_team: Optional[TeamInfo] = None
    away_team: Optional[TeamInfo] = None
    model_config = ConfigDict(from_attributes=True)
