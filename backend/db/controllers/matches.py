from sqlalchemy.orm import Session, joinedload
from db.models.matches import Match
from datetime import datetime

def upsert_match(db: Session, match_data: dict):
    # Handle datetime conversion if it's a string
    if isinstance(match_data.get('kickoff_utc'), str):
        match_data['kickoff_utc'] = datetime.fromisoformat(match_data['kickoff_utc'].replace('Z', '+00:00'))

    db_match = db.query(Match).filter(Match.id == match_data['id']).first()
    if db_match:
        for key, value in match_data.items():
            setattr(db_match, key, value)
    else:
        db_match = Match(**match_data)
        db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

def get_all_matches(db: Session, status: str = None, page: int = 1, page_size: int = 5):
    skip = (page - 1) * page_size
    query = db.query(Match).options(
        joinedload(Match.home_team),
        joinedload(Match.away_team)
    ).order_by(Match.kickoff_utc.asc())
    
    if status:
        query = query.filter(Match.status == status)
        
    return query.offset(skip).limit(page_size).all()
