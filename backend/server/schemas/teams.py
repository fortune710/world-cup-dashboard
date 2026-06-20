from pydantic import BaseModel, ConfigDict
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
    group: Optional[str] = None
    fifa_ranking: Optional[int] = None
    elo_rating: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class TeamStatRankItem(BaseModel):
    value: float
    rank: int

    model_config = ConfigDict(from_attributes=True)


class TeamStatisticsRankResponse(BaseModel):
    team_code: str
    total_teams: int
    goals: TeamStatRankItem
    pass_accuracy: TeamStatRankItem
    chances_created: TeamStatRankItem
    discipline: TeamStatRankItem

    model_config = ConfigDict(from_attributes=True)


class TeamTopPerformerBase(BaseModel):
    id: int
    name: str
    country_code: str
    image_url: Optional[str] = None
    classification: Optional[str] = None
    positions: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TeamTopPerformerRating(TeamTopPerformerBase):
    rating: float = 0


class TeamTopPerformerGoals(TeamTopPerformerBase):
    goals: int = 0


class TeamTopPerformerAssists(TeamTopPerformerBase):
    assists: int = 0


class TeamTopPerformerChances(TeamTopPerformerBase):
    big_chances_created: int = 0


class TeamTopPerformersResponse(BaseModel):
    rating: Optional[TeamTopPerformerRating] = None
    goals: Optional[TeamTopPerformerGoals] = None
    assists: Optional[TeamTopPerformerAssists] = None
    big_chances_created: Optional[TeamTopPerformerChances] = None

    model_config = ConfigDict(from_attributes=True)
