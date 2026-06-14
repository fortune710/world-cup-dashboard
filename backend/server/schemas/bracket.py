from typing import List
from pydantic import BaseModel
from server.schemas.matches import MatchResponse

class RoundBracketResponse(BaseModel):
    round: str
    matches: List[MatchResponse]

class BracketResponse(BaseModel):
    rounds: List[RoundBracketResponse]
