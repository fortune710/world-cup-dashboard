from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from config.db import get_db
from db.controllers.matches import get_all_matches
from server.schemas.matches import MatchResponse
from typing import List, Optional

router = APIRouter(prefix="/matches", tags=["matches"])

@router.get("/", response_model=List[MatchResponse])
def get_matches(
    status: Optional[str] = Query(None, description="Filter matches by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(5, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db)
):
    """
    Get list of matches (paginated and sorted by kickoff time), optionally filtered by status.
    """
    return get_all_matches(db, status=status, page=page, page_size=page_size)
