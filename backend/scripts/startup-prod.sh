#!/bin/bash

set -euo pipefail

echo "Preparing Python virtual environment"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

. .venv/bin/activate

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
