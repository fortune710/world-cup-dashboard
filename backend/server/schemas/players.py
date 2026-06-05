from pydantic import BaseModel, ConfigDict, Field
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
    statistics: Dict[str, Any] = Field(alias="stats_json")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
