from sqlalchemy.orm import Session
from sqlalchemy import text
from db.models.teams import Team

def upsert_team(db: Session, team_data: dict):
    payload = {k: v for k, v in team_data.items() if k != "id"}
    has_alpha_3_code = bool(team_data.get("alpha_3_code"))
    lookup_codes = set()

    if payload.get("code"):
        lookup_codes.add(payload["code"])
    if team_data.get("alpha_3_code"):
        lookup_codes.add(team_data["alpha_3_code"])
    
    db_team = db.query(Team).filter(Team.code.in_(lookup_codes)).first()
    
    if not db_team and payload.get("name"):
        incoming_name = payload["name"].strip().lower()
        if not incoming_name:
            raise ValueError("Team name cannot be empty")
            
        db_team = db.query(Team).filter(Team.name.ilike(f"%{incoming_name}%")).first()

    if not db_team and payload.get("sofascore_id") is not None:
        db_team = db.query(Team).filter(Team.sofascore_id == payload["sofascore_id"]).first()

    if not db_team:
        # Only teams_pipeline should create brand-new records:
        # allow create when payload is code-only (no alpha_3_code in source payload).
        if payload.get("code") and not has_alpha_3_code:
            db.execute(text("SELECT setval(pg_get_serial_sequence('teams','id'), COALESCE((SELECT MAX(id) FROM teams), 1), true)"))
            db_team = Team(**payload)
            db.add(db_team)
            db.commit()
            db.refresh(db_team)
            return db_team
        return None

    # If this code is already owned by another row, keep the DB's existing code assignments.
    existing_by_code = None
    if payload.get("code"):
        existing_by_code = db.query(Team).filter(Team.code == payload["code"]).first()
    if existing_by_code and existing_by_code.id != db_team.id:
        payload.pop("code", None)
        payload.pop("alpha_3_code", None)

    # team_details payloads include alpha_3_code; they should enrich stats only,
    # never overwrite identity/display fields from the base teams pipeline.
    if has_alpha_3_code:
        payload.pop("code", None)
        payload.pop("name", None)
        payload.pop("group", None)
    
    for key, value in payload.items():
        setattr(db_team, key, value)

    db.commit()
    db.refresh(db_team)
    return db_team

def get_all_teams(db: Session, group: str = None):
    query = db.query(Team)
    if group:
        query = query.filter(Team.group == group).order_by(
            Team.points.desc(),
            (Team.goals_for - Team.goals_against).desc(),
            Team.goals_for.desc(),
            Team.name.asc()
        )
    return query.all()

def upsert_teams_batch(db: Session, teams_data: list[dict]):
    """
    Batch upsert teams using code and alpha_3_code as potential identifiers against the 'code' column.
    """
    if not teams_data:
        return 0

    # Extract all possible codes for lookup
    lookup_codes = set()
    for team in teams_data:
        if team.get("code"):
            lookup_codes.add(team["code"])
        if team.get("alpha_3_code"):
            lookup_codes.add(team["alpha_3_code"])

    # Fetch existing teams by code
    existing_teams = db.query(Team).filter(Team.code.in_(lookup_codes)).all()
    team_map = {t.code: t for t in existing_teams}

    # Second pass for sofascore_id if not found by code
    sofascore_ids = [t.get("sofascore_id") for t in teams_data if t.get("sofascore_id")]
    if sofascore_ids:
        existing_by_id = db.query(Team).filter(Team.sofascore_id.in_(sofascore_ids)).all()
        for t in existing_by_id:
            if t.code not in team_map:
                team_map[f"sid_{t.sofascore_id}"] = t

    updated_count = 0
    new_count = 0

    for team_payload in teams_data:
        # Clean payload (remove fields not in model like alpha_3_code)
        clean_payload = {k: v for k, v in team_payload.items() if k != "id" and k != "alpha_3_code"}
        
        # Identification logic
        db_team = team_map.get(team_payload.get("code"))
        if not db_team and team_payload.get("alpha_3_code"):
            db_team = team_map.get(team_payload.get("alpha_3_code"))
        if not db_team and team_payload.get("sofascore_id"):
            db_team = team_map.get(f"sid_{team_payload.get('sofascore_id')}")

        if db_team:
            for key, value in clean_payload.items():
                setattr(db_team, key, value)
            updated_count += 1
        else:
            db.execute(text("SELECT setval(pg_get_serial_sequence('teams','id'), COALESCE((SELECT MAX(id) FROM teams), 1), true)"))
            db_team = Team(**clean_payload)
            db.add(db_team)
            new_count += 1
            # Add to map to prevent duplicates in same batch if they share identifiers (unlikely but safe)
            if db_team.code:
                team_map[db_team.code] = db_team

    db.commit()
    return updated_count + new_count

def get_next_team_to_index(db: Session):
    return db.query(Team).filter(Team.players_indexed == False).first()

def mark_team_as_indexed(db: Session, team_code: str):
    db_team = db.query(Team).filter(Team.code == team_code).first()
    if db_team:
        db_team.players_indexed = True
        db.commit()
    return db_team

def recalculate_team_standings(db: Session):
    logger.info({"message": "Starting recalculation of team standings from completed matches"})
    from db.models.matches import Match
    try:
        # Reset standings metrics for all teams
        db.query(Team).update({
            Team.matches_played: 0,
            Team.matches_won: 0,
            Team.matches_drawn: 0,
            Team.matches_lost: 0,
            Team.goals_for: 0,
            Team.goals_against: 0,
            Team.points: 0,
        }, synchronize_session=False)

        # Get all completed matches
        completed_matches = db.query(Match).filter(Match.status == "completed").all()
        logger.info({
            "message": "Fetched completed matches for standings recalculation",
            "count": len(completed_matches)
        })

        team_stats = {}
        for match in completed_matches:
            h_code = match.home_team_code
            a_code = match.away_team_code
            h_score = match.home_score if match.home_score is not None else 0
            a_score = match.away_score if match.away_score is not None else 0

            if not h_code or not a_code:
                continue

            for code in (h_code, a_code):
                if code not in team_stats:
                    team_stats[code] = {
                        "played": 0, "won": 0, "drawn": 0, "lost": 0,
                        "goals_for": 0, "goals_against": 0, "points": 0
                    }

            # Update played & goals
            team_stats[h_code]["played"] += 1
            team_stats[h_code]["goals_for"] += h_score
            team_stats[h_code]["goals_against"] += a_score

            team_stats[a_code]["played"] += 1
            team_stats[a_code]["goals_for"] += a_score
            team_stats[a_code]["goals_against"] += h_score

            # Match outcome
            if h_score > a_score:
                team_stats[h_code]["won"] += 1
                team_stats[h_code]["points"] += 3
                team_stats[a_code]["lost"] += 1
            elif a_score > h_score:
                team_stats[a_code]["won"] += 1
                team_stats[a_code]["points"] += 3
                team_stats[h_code]["lost"] += 1
            else:
                team_stats[h_code]["drawn"] += 1
                team_stats[h_code]["points"] += 1
                team_stats[a_code]["drawn"] += 1
                team_stats[a_code]["points"] += 1

        # Bulk update teams
        for code, stats in team_stats.items():
            db.query(Team).filter(Team.code == code).update({
                Team.matches_played: stats["played"],
                Team.matches_won: stats["won"],
                Team.matches_drawn: stats["drawn"],
                Team.matches_lost: stats["lost"],
                Team.goals_for: stats["goals_for"],
                Team.goals_against: stats["goals_against"],
                Team.points: stats["points"],
            }, synchronize_session=False)

        db.flush()
        logger.info({"message": "Successfully completed recalculating team standings"})
    except Exception as e:
        logger.error({
            "message": "Failed to recalculate team standings",
            "error": {"message": str(e), "type": type(e).__name__}
        })
        raise
