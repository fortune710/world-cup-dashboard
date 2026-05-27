# World Cup 2026 Data Pipeline Documentation

This pipeline is designed to extract, transform, and load World Cup 2026 data from an external API into a local PostgreSQL database using Apache Airflow for orchestration.

## Architecture

1.  **Source Layer (`backend/pipeline/sources/`)**:
    -   **`teams.py`**: Contains `TeamsSource` class for fetching team assignments.
    -   **`matches.py`**: Contains `MatchesSource` class for fetching the full match schedule and live status.

2.  **Transformation Layer (`backend/pipeline/transformations/`)**:
    -   **`teams.py`**: Processes raw team data, mapping logos and groups.
    -   **`matches.py`**: Processes match data, handling foreign key consistency and cleanup.

3.  **Load Layer (`backend/pipeline/load/`)**:
    -   **`teams.py`**: Loads processed team data into the Postgres database.
    -   **`matches.py`**: Loads processed match data into the Postgres database.

4.  **Orchestration Layer (`backend/pipeline/orchestration/`)**:
    -   **`teams_pipeline.py`**: ETL DAG for team data.
    -   **`matches_pipeline.py`**: ETL DAG for match data.
    -   Each DAG consists of three distinct `PythonOperator` tasks:
        -   `extract`: Fetches raw data from the API and pushes to XCom.
        -   `transform`: Pulls raw data from XCom, applies mapping logic, and pushes transformed data.
        -   `load`: Pulls transformed data and saves it to the PostgreSQL database.

5.  **Database Layer (`backend/db/`)**:
    -   **`models/`**: SQLAlchemy models (`teams.py`, `matches.py`) defining the database schema and relationships (e.g., Foreign Keys).
    -   **`controllers/`**: Data Access Objects (DAOs) containing the logic for upserting and querying teams and matches, ensuring database integrity.

## Database Schema Definitions

### Teams Table
- `id`: Unique identifier (int)
- `name`: Full country name
- `code`: 3-letter FIFA code (Unique)
- `logo_url`: URL to the team's logo/flag
- `group`: Group assignment (A-L)

### Matches Table
- `id`: Unique identifier (int)
- `round`: Competition stage (group, R32, etc.)
- `group`: Group letter if applicable
- `home_team_code`: FKey referencing `teams.code`
- `away_team_code`: FKey referencing `teams.code`
- `stadium`: Official stadium name
- `kickoff_utc`: Kickoff time in UTC
- `status`: Match status (scheduled, live, completed)
- `phase`: Current match phase (PRE, 1H, HT, 2H, ET, PEN, FT)
- `home_score` / `away_score`: Current scores
- `home_pen` / `away_pen`: Penalty scores if applicable

## Infrastructure (Docker)
The system runs on the standard `compose.yaml` specification, including:
- **Postgres**: Primary data store.
- **Airflow Webserver**: UI for managing DAGs (port 8080).
- **Airflow Scheduler**: Handles task execution.
- **Airflow Init**: One-time database initialization and admin user creation.
- **Web API**: The FastAPI backend application.

## Database Migrations
We use **Alembic** for handling database schema changes. To apply migrations, run the following command from the `backend` directory:

```bash
# Using the helper script
bash scripts/migrate.sh

# Or using alembic directly
alembic upgrade head
```

New migrations can be generated automatically after model changes:
```bash
# Using the helper script
bash scripts/generate_migration.sh "description of changes"

# Or using alembic directly
alembic revision --autogenerate -m "description of changes"
```

### Default Credentials
- **Airflow UI**: `admin` / `admin`
- **Postgres**: Defined in `.env`
