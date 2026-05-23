#!/bin/bash
# Run database migrations

# Ensure we are in the backend directory
cd "$(dirname "$0")/.."

echo "Running database migrations..."
alembic upgrade head
