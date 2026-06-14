import logging
from datetime import date as Date
from typing import List, Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.matches import get_all_matches, get_matchday_statistics_by_date
from server.schemas.matches import MatchResponse, MatchdayStatisticResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/matches", tags=["matches"])

@router.get("", response_model=List[MatchResponse])
def get_matches(
    status: Optional[str] = Query(None, description="Filter matches by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(5, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db)
):
    """
    Get list of matches (paginated and sorted by kickoff time), optionally filtered by status.
    """
    logger.info(
        {
            "message": "Fetching matches",
            "status": status,
            "page": page,
            "page_size": page_size,
        }
    )
    matches = get_all_matches(db, status=status, page=page, page_size=page_size)
    logger.info(
        {
            "message": "Returning matches",
            "status": status,
            "page": page,
            "page_size": page_size,
            "count": len(matches),
        }
    )
    return matches


@router.get("/{date}/statistics", response_model=List[MatchdayStatisticResponse])
def get_matchday_statistics(
    date: Date = Path(..., description="Match date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    """
    Get the top matchday stats leaders for a single match date.
    """
    logger.info(
        {
            "message": "Fetching matchday statistics leaders",
            "match_date": date.isoformat(),
        }
    )
    result = get_matchday_statistics_by_date(db, date)
    logger.info(
        {
            "message": "Returning matchday statistics leaders",
            "match_date": date.isoformat(),
            "count": len(result),
        }
    )
    return result
