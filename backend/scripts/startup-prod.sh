#!/bin/bash

set -euo pipefail

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
  grafana
