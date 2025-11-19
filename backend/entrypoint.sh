#!/usr/bin/env sh
set -e

echo "[entrypoint] Running database migrations..."
# Ensure Alembic uses our env.py which reads DATABASE_URL from environment/settings
alembic upgrade head

echo "[entrypoint] Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
