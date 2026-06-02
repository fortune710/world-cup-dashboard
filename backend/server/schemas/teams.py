from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class TeamStandingResponse(BaseModel):
    name: str
    code: str
    matches_played: int
    matches_won: int
    matches_drawn: int
    matches_lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int

    model_config = ConfigDict(from_attributes=True)
