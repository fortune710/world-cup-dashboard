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

echo "Starting Docker containers in prod mode"
docker compose up -d \
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
