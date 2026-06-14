import logging
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.db import get_db
from db.controllers.matches import get_bracket_matches
from server.schemas.bracket import RoundBracketResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bracket", tags=["bracket"])

@router.get("/", response_model=List[RoundBracketResponse])
def get_bracket(db: Session = Depends(get_db)):
    """
    Get the tournament bracket structure with all knockout stage matches.
    """
    logger.info({"message": "Handling bracket request"})
    
    result = get_bracket_matches(db)
    
    logger.info(
        {
            "message": "Returning bracket data",
            "rounds_count": len(result)
        }
    )
    return result
