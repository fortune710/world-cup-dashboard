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
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Neither 'docker compose' nor 'docker-compose' is installed on this server."
  echo "Install the Docker Compose plugin or the legacy docker-compose binary, then rerun deployment."
  exit 1
fi

echo "Starting Docker containers in prod mode"
${COMPOSE_CMD} -f compose.prod.yaml up -d --build \
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
