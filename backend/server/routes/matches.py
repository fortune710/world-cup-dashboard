import logging
from datetime import date as Date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Path, Query, HTTPException
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.matches import (
    get_all_matches,
    get_matches_by_date,
    get_matchday_statistics_by_date,
)
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


@router.get("/{match_date}", response_model=List[MatchResponse])
def get_matches_for_date(
    match_date: str = Path(..., description="Match date in YYYY-MM-DD format (optionally with timezone suffix)"),
    status: Optional[str] = Query(None, description="Filter matches by status"),
    timezone: Optional[str] = Query(None, description="Timezone name or offset, e.g. America/New_York or -04:00"),
    db: Session = Depends(get_db),
):
    """
    Get all matches for a specific date, optionally filtered by status and timezone.
    """
    logger.info(
        {
            "message": "Fetching matches for date",
            "match_date_raw": match_date,
            "status": status,
            "timezone_query": timezone,
        }
    )
    
    resolved_tz = timezone or "UTC"
    try:
        match_date_str = match_date.strip()
        resolved_date = None

        if len(match_date_str) == 10:
            try:
                resolved_date = Date.fromisoformat(match_date_str)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid date format: {match_date_str}. Expected YYYY-MM-DD."
                )
        else:
            date_part = match_date_str[:10]
            tz_part = match_date_str[10:]
            
            if tz_part == "Z":
                tz_part = "UTC"
            elif tz_part.startswith("T"):
                try:
                    dt = datetime.fromisoformat(match_date_str)
                    resolved_date = dt.date()
                    if dt.tzinfo is not None:
                        offset = dt.utcoffset()
                        if offset is not None:
                            total_seconds = int(offset.total_seconds())
                            sign = "-" if total_seconds < 0 else "+"
                            abs_seconds = abs(total_seconds)
                            hours = abs_seconds // 3600
                            minutes = (abs_seconds % 3600) // 60
                            tz_part = f"{sign}{hours:02d}:{minutes:02d}"
                        else:
                            tz_part = "UTC"
                    else:
                        tz_part = "UTC"
                except ValueError:
                    pass
            
            if resolved_date is None:
                try:
                    resolved_date = Date.fromisoformat(date_part)
                    resolved_tz = tz_part
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid date format: {match_date_str}. Expected YYYY-MM-DD with optional timezone offset."
                    )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            {
                "message": "Unexpected error parsing match date or timezone",
                "match_date_raw": match_date,
                "timezone_query": timezone,
                "error": str(exc),
            }
        )
        raise HTTPException(status_code=400, detail="Error parsing request parameters")

    logger.info(
        {
            "message": "Resolved match date parameters",
            "match_date_raw": match_date,
            "resolved_date": resolved_date.isoformat(),
            "resolved_timezone": resolved_tz,
            "status": status,
        }
    )

    try:
        matches = get_matches_by_date(db, resolved_date, status=status, timezone_str=resolved_tz)
    except ValueError as val_err:
        logger.warning(
            {
                "message": "Validation error getting matches by date",
                "match_date": resolved_date.isoformat(),
                "timezone": resolved_tz,
                "error": str(val_err),
            }
        )
        raise HTTPException(status_code=400, detail=str(val_err))
    
    logger.info(
        {
            "message": "Returning matches for date",
            "match_date": resolved_date.isoformat(),
            "resolved_timezone": resolved_tz,
            "status": status,
            "count": len(matches),
        }
    )
    return matches
