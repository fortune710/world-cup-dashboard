# World Cup Dashboard

A comprehensive dashboard for world cup data processing and visualization.

## Prerequisites

- Docker
- Docker Compose

---

## Getting Started

### 1. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

The default `.env.example` is configured for Docker Compose. Containers connect to Postgres through the Compose service name `db`:

```env
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_HOST_PORT=5433
DATABASE_URL=postgresql://postgres:postgres@db:5432/world_cup_db
```

`POSTGRES_HOST_PORT=5433` publishes Postgres on `localhost:5433` to avoid clashing with a local Postgres install on `localhost:5432`. Inside Docker, services still use `db:5432`.

If you already created a Postgres volume with a different password, either keep using that original password or reset the local Docker data:

```bash
cd backend
docker compose down -v
```

---

## Running with Docker

This is the easiest way to get everything (Database, API, Airflow) running in sync.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Start all services:**
    ```bash
    docker compose up --build -d
    ```

    The FastAPI container runs Alembic migrations automatically before starting the server.

3.  **Access the services:**
    - **FastAPI Server:** [http://localhost:8000](http://localhost:8000)
    - **Airflow Webserver:** [http://localhost:8080](http://localhost:8080) (Log in with credentials from `.env`)

### Useful Docker Commands

Run migrations manually if needed:

```bash
docker compose exec web alembic upgrade head
```

Run the Elo unit tests inside the backend image:

```bash
docker compose run --rm web python -m unittest tests/test_elo_transformation.py
```

Show API logs:

```bash
docker compose logs -f web
```

Stop the stack:

```bash
docker compose down
```

Stop the stack and remove local database volumes:

```bash
docker compose down -v
```

---

## Project Structure

- `backend/server/`: FastAPI application logic.
- `backend/pipeline/`: ETL pipelines and Airflow DAGs.
- `backend/config/`: Configuration files and database connections.
- `backend/scripts/`: Useful automation scripts.
