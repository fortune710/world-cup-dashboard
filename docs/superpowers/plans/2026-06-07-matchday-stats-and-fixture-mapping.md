# Matchday Stats and Fixture Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `MatchdayStats` model, extend `matches` with `sofascore_id`, and build an Airflow ETL pipeline that maps Sofascore fixtures to database matches using the team `sofascore_id` bridge.

**Architecture:** Keep the work split into schema, mapping logic, and orchestration. The schema change adds a new table plus the match-level external id, the transform layer resolves fixture team ids into internal team codes and then finds the matching `matches` row, and the Airflow DAG stays a thin extract/transform/load wrapper with DB sorting/filtering handled in query code rather than Python post-processing.

**Tech Stack:** SQLAlchemy ORM, Alembic, Airflow PythonOperator DAGs, the existing `sofascore_wrapper` package, `pytest`/`unittest`, PostgreSQL JSONB.

---

### Task 1: Add the `MatchdayStats` model and the schema migration

**Files:**
- Create: `backend/db/models/matchday_stats.py`
- Modify: `backend/db/models/matches.py`
- Modify: `backend/db/models/__init__.py`
- Create: `backend/alembic/versions/a7b9c2d4e6f1_add_matchday_stats_and_matches_sofascore_id.py`
- Test: `backend/tests/test_matchday_stats_schema.py`

- [ ] **Step 1: Write the failing test**

```python
def test_matchday_stats_model_and_matches_sofascore_id_are_reflected():
    inspector = sa.inspect(bind)

    assert "matchday_stats" in inspector.get_table_names()
    columns = {column["name"] for column in inspector.get_columns("matchday_stats")}
    assert columns == {"id", "player_id", "match_id", "match_date", "statistics"}

    match_columns = {column["name"] for column in inspector.get_columns("matches")}
    assert "sofascore_id" in match_columns
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose run --rm --build web python -m unittest discover -s tests -p test_matchday_stats_schema.py`
Expected: FAIL because the model/table and `matches.sofascore_id` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```python
# backend/db/models/matchday_stats.py
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB

from config.db import Base


class MatchdayStats(Base):
    __tablename__ = "matchday_stats"

    id = Column(BigInteger, primary_key=True, index=True)
    player_id = Column(BigInteger, ForeignKey("players.id"), nullable=False, index=True)
    match_id = Column(BigInteger, ForeignKey("matches.id"), nullable=False, index=True)
    match_date = Column(DateTime, nullable=False, index=True)
    statistics = Column(JSONB, nullable=False)
```

```python
# backend/alembic/versions/a7b9c2d4e6f1_add_matchday_stats_and_matches_sofascore_id.py
def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "matches" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("matches")}
        if "sofascore_id" not in columns:
            op.add_column("matches", sa.Column("sofascore_id", sa.BigInteger(), nullable=True))

    if "matchday_stats" not in inspector.get_table_names():
        op.create_table(
            "matchday_stats",
            sa.Column("id", sa.BigInteger(), primary_key=True),
            sa.Column("player_id", sa.BigInteger(), nullable=False),
            sa.Column("match_id", sa.BigInteger(), nullable=False),
            sa.Column("match_date", sa.DateTime(), nullable=False),
            sa.Column("statistics", sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker compose run --rm --build web python -m unittest discover -s tests -p test_matchday_stats_schema.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/db/models/matchday_stats.py backend/db/models/matches.py backend/db/models/__init__.py backend/alembic/versions/a7b9c2d4e6f1_add_matchday_stats_and_matches_sofascore_id.py backend/tests/test_matchday_stats_schema.py
git commit -m "feat: add matchday stats schema and match sofascore id"
```

### Task 2: Add the fixture-to-match mapping helpers

**Files:**
- Modify: `backend/db/controllers/teams.py`
- Modify: `backend/db/controllers/matches.py`
- Create: `backend/pipeline/transformations/match_id_mapping.py`
- Test: `backend/tests/test_match_id_mapping_transform.py`

- [ ] **Step 1: Write the failing test**

```python
def test_maps_fixture_teams_to_internal_codes_and_match():
    teams = [
        {"name": "Team A", "code": "AAA", "sofascore_id": 101},
        {"name": "Team B", "code": "BBB", "sofascore_id": 202},
    ]
    fixtures = [
        {"id": 9001, "homeTeam": {"id": 101}, "awayTeam": {"id": 202}, "kickoffTime": "2026-06-01T18:00:00Z"},
    ]

    mapped = MatchIdMappingTransformations().transform_fixtures_to_matches(teams, fixtures)

    assert mapped[0]["home_team_code"] == "AAA"
    assert mapped[0]["away_team_code"] == "BBB"
    assert mapped[0]["sofascore_id"] == 9001
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose run --rm --build web python -m unittest discover -s tests -p test_match_id_mapping_transform.py`
Expected: FAIL because the transform helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```python
class MatchIdMappingTransformations:
    def transform_fixtures_to_matches(self, teams, fixtures):
        team_code_by_sofascore_id = {team["sofascore_id"]: team["code"] for team in teams}
        mapped = []
        for fixture in fixtures:
            mapped.append({
                "sofascore_id": fixture["id"],
                "home_team_code": team_code_by_sofascore_id[fixture["homeTeam"]["id"]],
                "away_team_code": team_code_by_sofascore_id[fixture["awayTeam"]["id"]],
                "kickoff_utc": fixture["kickoffTime"],
                "status": fixture.get("status"),
            })
        return mapped
```

```python
# backend/db/controllers/matches.py
def update_match_sofascore_id(db: Session, match_id: int, sofascore_id: int) -> None:
    logger.info({"message": "Updating match sofascore_id", "match_id": match_id, "sofascore_id": sofascore_id})
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if db_match:
        db_match.sofascore_id = sofascore_id
        db.commit()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker compose run --rm --build web python -m unittest discover -s tests -p test_match_id_mapping_transform.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/db/controllers/teams.py backend/db/controllers/matches.py backend/pipeline/transformations/match_id_mapping.py backend/tests/test_match_id_mapping_transform.py
git commit -m "feat: add fixture to match mapping helpers"
```

### Task 3: Build the `map_match_id_pipeline.py` DAG

**Files:**
- Create: `backend/pipeline/orchestration/map_match_id_pipeline.py`
- Create: `backend/pipeline/sources/fixtures.py`
- Test: `backend/tests/test_map_match_id_pipeline.py`

- [ ] **Step 1: Write the failing test**

```python
def test_pipeline_exposes_extract_transform_load_tasks():
    from pipeline.orchestration.map_match_id_pipeline import dag
    assert dag.task_ids == {"extract_teams_and_fixtures", "transform_match_ids", "load_match_ids"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose run --rm --build web python -m unittest discover -s tests -p test_map_match_id_pipeline.py`
Expected: FAIL because the DAG module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```python
with DAG(
    "map_match_id_pipeline",
    default_args=default_args,
    description="ETL pipeline for mapping Sofascore fixtures to matches",
    schedule=timedelta(hours=6),
    catchup=False,
) as dag:
    task_extract = PythonOperator(
        task_id="extract_teams_and_fixtures",
        python_callable=extract_teams_and_fixtures,
    )
    task_transform = PythonOperator(
        task_id="transform_match_ids",
        python_callable=transform_match_ids,
    )
    task_load = PythonOperator(
        task_id="load_match_ids",
        python_callable=load_match_ids,
    )

    task_extract >> task_transform >> task_load
```

```python
def extract_teams_and_fixtures(**context):
    logger.info({"message": "Starting match id extraction"})
    db = SessionLocal()
    try:
        teams = get_teams_for_match_mapping(db)
        fixtures = FixturesSource().get_fixtures()
        return {"teams": teams, "fixtures": fixtures}
    finally:
        db.close()
```

```python
def load_match_ids(**context):
    logger.info({"message": "Starting match id load"})
    transformed = context["ti"].xcom_pull(task_ids="transform_match_ids")
    db = SessionLocal()
    try:
        for match in transformed["matches"]:
            update_match_sofascore_id(db, match["match_id"], match["sofascore_id"])
    finally:
        db.close()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker compose run --rm --build web python -m unittest discover -s tests -p test_map_match_id_pipeline.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline/orchestration/map_match_id_pipeline.py backend/tests/test_map_match_id_pipeline.py backend/pipeline/orchestration/__init__.py
git commit -m "feat: add match id mapping pipeline"
```

### Task 4: Validate the migration and pipeline end to end

**Files:**
- None new; verify the changed files from Tasks 1-3

- [ ] **Step 1: Run the full backend test suite**

Run: `docker compose run --rm --build web python -m unittest discover -s tests`
Expected: PASS with no new failures.

- [ ] **Step 2: Run the Alembic smoke test**

Run: `docker compose run --rm --build web alembic upgrade head`
Expected: PASS and stamp the new migration head.

- [ ] **Step 3: Sanity-check the DAG file loads**

Run: `docker compose run --rm --build web python -c "from pipeline.orchestration.map_match_id_pipeline import dag; print(dag.dag_id)"`
Expected: prints `map_match_id_pipeline`.

- [ ] **Step 4: Commit**

```bash
git add backend docs/superpowers/plans/2026-06-07-matchday-stats-and-fixture-mapping.md
git commit -m "docs: add matchday stats and fixture mapping plan"
```

## Self-Review

- Spec coverage:
  - `MatchdayStats` model is covered in Task 1.
  - `matches.sofascore_id` is covered in Task 1.
  - The new ETL DAG with extract/transform/load tasks is covered in Task 3.
  - Mapping fixtures to teams via `sofascore_id` is covered in Task 2 and Task 3.
- Placeholder scan:
  - No `TBD` or open-ended implementation notes are left in the task steps.
  - Exact file paths are named for every changed file, including the new migration filename.
- Type consistency:
  - `MatchdayStats` uses `id`, `player_id`, `match_id`, `match_date`, and `statistics` consistently across model, migration, and tests.
  - The transform helpers return `sofascore_id` and internal team codes consistently across pipeline stages.
