#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

echo "Preparing Python virtual environment"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

. .venv/bin/activate

if ! docker ps >/dev/null 2>&1; then
  echo "Docker is not accessible to this user. Add deployment-admin to the docker group and reconnect the SSH session."
  exit 1
fi

COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "The Docker Compose plugin is not installed or not available on PATH."
  echo "Install the plugin so 'docker compose' works, then rerun deployment."
  exit 1
fi

ensure_airflow_pipelines_unpaused() {
  local dag_status_json=""
  local paused_dags=""
  local attempt=1
  local max_attempts=30

  while [ "$attempt" -le "$max_attempts" ]; do
    if dag_status_json="$(${COMPOSE_CMD} -f compose.prod.yaml exec -T airflow-webserver airflow dags list --output json 2>/dev/null)"; then
      if paused_dags="$(
        DAG_STATUS_JSON="$dag_status_json" python3 - <<'PY'
import json
import os
import sys

target_dags = [
    "world_cup_teams_pipeline",
    "world_cup_team_details_pipeline",
    "world_cup_player_info_pipeline",
    "world_cup_matches_pipeline",
]

try:
    dag_statuses = json.loads(os.environ["DAG_STATUS_JSON"])
except json.JSONDecodeError as exc:
    print(f"Failed to parse Airflow DAG status: {exc}", file=sys.stderr)
    raise SystemExit(1)

dag_by_id = {
    dag.get("dag_id"): dag
    for dag in dag_statuses
    if isinstance(dag, dict) and dag.get("dag_id")
}

missing = [dag_id for dag_id in target_dags if dag_id not in dag_by_id]
if missing:
    print(f"Missing Airflow DAG metadata for: {' '.join(missing)}", file=sys.stderr)
    raise SystemExit(1)

paused = [dag_id for dag_id in target_dags if dag_by_id[dag_id].get("is_paused")]
print(" ".join(paused))
PY
      )"; then
        if [ -n "$paused_dags" ]; then
          echo "Unpausing Airflow DAGs: $paused_dags"
          for dag_id in $paused_dags; do
            ${COMPOSE_CMD} -f compose.prod.yaml exec -T airflow-webserver airflow dags unpause "$dag_id"
          done
        else
          echo "Airflow DAGs are already unpaused."
        fi
        return 0
      fi
    fi

    echo "Waiting for Airflow DAG metadata to become available (attempt $attempt/$max_attempts)..."
    sleep 10
    attempt=$((attempt + 1))
  done

  echo "Timed out waiting for Airflow DAG metadata."
  exit 1
}

ensure_nginx_tls_certs() {
  local cert_dir="config/nginx/certs"
  local cert_file="$cert_dir/server.crt"
  local key_file="$cert_dir/server.key"

  if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
    echo "Nginx TLS certificates already exist"
    return 0
  fi

  echo "Generating self-signed Nginx TLS certificates"
  mkdir -p "$cert_dir"

  if ! command -v openssl >/dev/null 2>&1; then
    echo "OpenSSL is required to generate Nginx TLS certificates."
    exit 1
  fi

  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "$key_file" \
    -out "$cert_file" \
    -subj "/CN=world-cup-dashboard"
  chmod 600 "$key_file"
}

ensure_nginx_tls_certs

echo "Starting Docker containers in prod mode"
${COMPOSE_CMD} -f compose.prod.yaml up -d --build --remove-orphans \
  web \
  airflow-webserver \
  airflow-scheduler \
  airflow-init \
  celery-beat \
  celery-worker-fetch \
  celery-worker-db \
  rabbitmq \
  prometheus \
  grafana \
  nginx

echo "Checking Airflow pipeline pause state"
ensure_airflow_pipelines_unpaused
