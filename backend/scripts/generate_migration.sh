#!/bin/bash
# Generate a new database migration based on model changes

# Ensure we are in the backend directory
cd "$(dirname "$0")/.."

# Check if message is provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/generate_migration.sh \"description of changes\""
    exit 1
fi

echo "Generating migration: $1..."
alembic revision --autogenerate -m "$1"
