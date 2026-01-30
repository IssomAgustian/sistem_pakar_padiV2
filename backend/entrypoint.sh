#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running database migrations..."
  flask db upgrade
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Seeding database..."
  python seed_data.py
fi

exec "$@"
