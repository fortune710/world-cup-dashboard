# World Cup 2026 Data Pipeline Documentation

This pipeline is designed to extract, transform, and load World Cup 2026 data from an external API into a local PostgreSQL database using Apache Airflow for orchestration.

## Architecture

1.  **Source Layer (`backend/pipeline/sources/teams.py`)**:
    -   Communicates with `https://api.wc2026api.com`.
    -   `get_teams()`: Fetches information about all 48 teams.
    -   `get_matches()`: Fetches all match schedules and data.

2.  **Transformation Layer (`backend/pipeline/transformations/teams.py`)**:
    -   Processes raw JSON data from the API.
    -   Maps API keys to internal database schema (e.g., `flag_url` -> `logo_url`).
    -   Handles default values and removes unnecessary fields.

3.  **Load Layer (`backend/pipeline/load/teams.py`)**:
    -   Uses SQLAlchemy models to push data into Postgres.
    -   Implements "upsert" logic to prevent duplicate entries while keeping data updated.

4.  **Orchestration Layer (`backend/pipeline/orchestration/`)**:
    -   **`teams_pipeline.py`**: ETL DAG for team data.
    -   **`matches_pipeline.py`**: ETL DAG for match data.
    -   Each DAG consists of three distinct `PythonOperator` tasks:
        -   `extract`: Fetches raw data from the API and pushes to XCom.
        -   `transform`: Pulls raw data from XCom, applies mapping logic, and pushes transformed data.
        -   `load`: Pulls transformed data and saves it to the PostgreSQL database.

5.  **Database Layer (`backend/db/`)**:
    -   **Models**: `Team` and `Match` objects defining the schema.
    -   **Controllers**: Functions to handle database operations (upserts).

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

### Default Credentials
- **Airflow UI**: `admin` / `admin`
- **Postgres**: Defined in `.env`
