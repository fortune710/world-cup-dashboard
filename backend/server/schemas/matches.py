from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, confloat, conint, constr

class TeamInfo(BaseModel):
    name: str
    code: str
    model_config = ConfigDict(from_attributes=True)


class MatchdayStatisticName(str, Enum):
    RATING = "rating"
    GOAL_CONTRIBUTIONS = "goal_contributions"
    PASS_ACCURACY = "pass_accuracy"

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


class MatchdayStatisticResponse(BaseModel):
    stat_name: MatchdayStatisticName
    value: conint(ge=0) | confloat(ge=0)
    player_name: constr(strip_whitespace=True, min_length=1)
    model_config = ConfigDict(from_attributes=True)
