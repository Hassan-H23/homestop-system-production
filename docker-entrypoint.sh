#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set. Refusing to start."
  exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting HomeStop application..."
exec "$@"
