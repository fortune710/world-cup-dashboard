#!/bin/bash

# Wait for database to be ready (optional but recommended)
# You could add a check here if needed

echo "Starting FastAPI server..."
# Run uvicorn from the app directory
# backend/server/main.py -> server.main:app
export PYTHONPATH=$PYTHONPATH:.
uvicorn server.main:app --host 0.0.0.0 --port 8000
