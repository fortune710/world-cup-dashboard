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

echo "Restarting Nginx to load the latest proxy configuration"
${COMPOSE_CMD} -f compose.prod.yaml restart nginx
