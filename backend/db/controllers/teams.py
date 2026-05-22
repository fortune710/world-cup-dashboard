from sqlalchemy.orm import Session
from db.models.teams import Team

def upsert_team(db: Session, team_data: dict):
    db_team = db.query(Team).filter(Team.id == team_data['id']).first()
    if db_team:
        for key, value in team_data.items():
            setattr(db_team, key, value)
    else:
        db_team = Team(**team_data)
        db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

def get_all_teams(db: Session):
    return db.query(Team).all()
