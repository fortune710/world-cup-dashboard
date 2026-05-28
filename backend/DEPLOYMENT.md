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
docker compose up -d web airflow-webserver airflow-scheduler airflow-init worker rabbitmq prometheus grafana
```

This allows your API/Airflow to use external managed databases via:

- `DATABASE_URL`
- `AIRFLOW_DATABASE_URL`

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
