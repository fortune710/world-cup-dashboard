# World Cup Dashboard

A comprehensive dashboard for world cup data processing and visualization.

## Prerequisites

- Python 3.12.9
- Docker & Docker Compose (optional, for containerized setup)
- `uv` (for fast dependency management)

---

## Getting Started

### 1. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

---

## Option 1: Running with Docker (Recommended)

This is the easiest way to get everything (Database, API, Airflow) running in sync.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Start all services:**
    ```bash
    docker compose up -d
    ```

3.  **Access the services:**
    - **FastAPI Server:** [http://localhost:8000](http://localhost:8000)
    - **Airflow Webserver:** [http://localhost:8080](http://localhost:8080) (Log in with credentials from `.env`)

---

## Option 2: Running without Docker (Manual Setup)

### 1. Database
You will need a PostgreSQL instance running locally. Ensure the credentials in `backend/.env` match your local setup.

### 2. Backend API
1.  **Install dependencies:**
    ```bash
    cd backend
    uv venv
    source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
    uv pip install -r requirements.txt
    ```

2.  **Start the server using the startup script:**
    ```bash
    chmod +x scripts/startup.sh
    ./scripts/startup.sh
    ```
    *Note: On Windows, you can run `uvicorn server.main:app --reload` directly.*

### 3. Airflow
1.  **Set Airflow Home:**
    ```bash
    export AIRFLOW_HOME=$(pwd)/backend/airflow
    mkdir -p $AIRFLOW_HOME
    ```

2.  **Initialize the database:**
    ```bash
    airflow db init
    ```

3.  **Create an admin user:**
    ```bash
    airflow users create \
        --username [USERNAME] \
        --firstname [First Name] \
        --lastname [Last Name] \
        --role Admin \
        --email [EMAIL_ADDRESS] \
        --password [PASSWORD]
    ```

4.  **Start Airflow services (in separate terminals or background):**
    ```bash
    airflow webserver -p 8080
    airflow scheduler
    ```

---

## Project Structure

- `backend/server/`: FastAPI application logic.
- `backend/pipeline/`: ETL pipelines and Airflow DAGs.
- `backend/config/`: Configuration files and database connections.
- `backend/scripts/`: Useful automation scripts.
