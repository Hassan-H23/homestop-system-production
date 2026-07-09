#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for PostgreSQL to accept connections..."
  npx prisma migrate deploy
fi

exec "$@"
