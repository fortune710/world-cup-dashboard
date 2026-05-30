# Deployment Notes

## Compose File Merging

Use multiple compose files to keep a base config and a production override:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

How it works:

- `compose.yaml` is loaded first (base).
- `compose.prod.yaml` is loaded second (override).
- Final config is merged left-to-right.
- Same scalar key in later file replaces earlier value.
- Map keys (like `environment`) merge, later keys win.
- Services in either file are included in final config.

Preview the effective merged configuration:

```bash
docker compose -f compose.yaml -f compose.prod.yaml config
```

## Running Only Production Services

If you want to run only app + airflow + monitoring (without local db bootstrap path), start only required services:

```bash
docker compose up -d web airflow-webserver airflow-scheduler airflow-init celery-beat celery-worker-fetch celery-worker-db rabbitmq prometheus grafana
```

This allows your API/Airflow to use external managed databases via:

- `DATABASE_URL`
- `AIRFLOW_DATABASE_URL`

## Deployment User and Virtualenv

The GitHub Actions deploy workflow SSHes into the droplet as `deployment-admin`.
The production startup script also creates a local Python virtual environment at `backend/.venv` before starting the Docker stack.
The `deployment-admin` user must be in the `docker` group so Docker can run non-interactively.
The droplet must have either `docker compose` or `docker-compose` installed.

## Environment File From GitHub Secrets

During deployment, GitHub Actions writes `backend/.env` on the droplet from GitHub Secrets before starting the stack.
Each secret should use the same name as the environment variable it represents.

## Required Environment Variables

- `DATABASE_URL`
- `AIRFLOW_DATABASE_URL`
- `AIRFLOW_ADMIN_USER`
- `AIRFLOW_ADMIN_PASSWORD`
- `AIRFLOW_WEBSERVER_SECRET_KEY`
- `WC2026_API_KEY`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `RABBITMQ_URL`
- `PROMETHEUS_PORT`
- `GRAFANA_PORT`
- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`
