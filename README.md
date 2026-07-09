# HomeStop System

HomeStop System is a Next.js App Router application using TypeScript, Prisma ORM, PostgreSQL, Clerk authentication, and npm. This repository includes Docker Compose files for local development and production-style deployment on a VPS.

## Prerequisites

Install these tools on your machine or VPS:

- Docker Engine
- Docker Compose plugin
- Git

Check installation:

```bash
docker --version
docker compose version
git --version
```

## Environment Setup

Create your local environment file from the example:

```bash
cp .env.example .env
```

Update `.env` with real values:

```env
APP_CONTAINER_NAME=homestop-app
APP_PORT=3000
POSTGRES_CONTAINER_NAME=homestop-postgres
POSTGRES_DB=homestop_system_db
POSTGRES_USER=homestop_user
POSTGRES_PASSWORD=change-this-password
POSTGRES_PORT=5432
DATABASE_URL=postgresql://homestop_user:change-this-password@postgres:5432/homestop_system_db
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

When running inside Docker Compose, the app container uses the database host `postgres`, not `localhost`. The Compose files construct the runtime `DATABASE_URL` from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`, so an old local `DATABASE_URL` value will not accidentally point the app container at `localhost`.

## Production Docker

Build and start the production containers:

```bash
docker compose up -d --build
```

Open the app:

```bash
http://localhost:3000
```

The app container runs Prisma migrations automatically on startup using:

```bash
npx prisma migrate deploy
```

It does not use `prisma db push`.

## Development Docker

For local development with hot reload:

```bash
docker compose -f docker-compose.dev.yml up --build
```

The development container mounts the source code into `/app`, installs dependencies into a named Docker volume, generates Prisma Client, runs migrations, and starts Next.js dev mode on `0.0.0.0:3000`.

Open:

```bash
http://localhost:3000
```

## Stopping Containers

Stop production containers:

```bash
docker compose down
```

Stop development containers:

```bash
docker compose -f docker-compose.dev.yml down
```

Stop and remove containers plus volumes, including database data:

```bash
docker compose down -v
```

Use `down -v` carefully because it deletes the PostgreSQL Docker volume.

## Rebuilding Containers

After dependency, Dockerfile, or environment changes:

```bash
docker compose up -d --build
```

Force a clean rebuild without cache:

```bash
docker compose build --no-cache
docker compose up -d
```

## Logs

View all logs:

```bash
docker compose logs -f
```

View app logs:

```bash
docker compose logs -f app
```

View PostgreSQL logs:

```bash
docker compose logs -f postgres
```

## Prisma Commands

Run migrations manually in production Compose:

```bash
docker compose exec app npx prisma migrate deploy
```

Generate Prisma Client manually:

```bash
docker compose exec app npx prisma generate
```

Open Prisma Studio locally if needed:

```bash
docker compose exec app npx prisma studio
```

## PostgreSQL Persistence

Production Compose stores PostgreSQL data in the named Docker volume:

```bash
homestop-postgres-data
```

Rebuilding containers does not delete this volume. Data persists after:

```bash
docker compose down
docker compose up -d --build
```

Data is deleted only if you remove the volume, for example:

```bash
docker compose down -v
```

## Backup PostgreSQL

Create a database backup from the production Compose stack:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > homestop-backup.sql
```

If your shell does not expand `.env` variables automatically, use explicit values:

```bash
docker compose exec -T postgres pg_dump -U homestop_user -d homestop_system_db > homestop-backup.sql
```

## Restore PostgreSQL

Restore a backup into the running PostgreSQL container:

```bash
docker compose exec -T postgres psql -U homestop_user -d homestop_system_db < homestop-backup.sql
```

For a clean restore, stop the app first so no writes happen during restore:

```bash
docker compose stop app
docker compose exec -T postgres psql -U homestop_user -d homestop_system_db < homestop-backup.sql
docker compose start app
```

## Hostinger VPS Deployment

On the VPS, install Docker and the Compose plugin, then clone the repository:

```bash
git clone <your-github-repo-url>
cd homestop-system-production
cp .env.example .env
nano .env
```

Set secure production values in `.env`. Important:

```env
POSTGRES_PASSWORD=your-secure-password
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-production-clerk-publishable-key
CLERK_SECRET_KEY=your-production-clerk-secret-key
```

For Docker Compose, keep the internal database host as `postgres`. You normally only need to set the `POSTGRES_*` values; Compose provides the app container with the correct Prisma connection string.

Start the app:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f app
```

The app will be reachable on port `3000` unless `APP_PORT` is changed. If port `3000` is already in use, set a different host port in `.env`, for example `APP_PORT=3300`.

## Future Deployments From GitHub

After pushing changes to GitHub, deploy updates on the VPS with:

```bash
cd homestop-system-production
git pull
docker compose up -d --build
```

This rebuilds the app image, starts the updated container, keeps the PostgreSQL volume, and runs pending Prisma migrations automatically through the app entrypoint.

## Useful Maintenance Commands

Restart the app container:

```bash
docker compose restart app
```

Run a shell inside the app container:

```bash
docker compose exec app sh
```

Run a SQL shell:

```bash
docker compose exec postgres psql -U homestop_user -d homestop_system_db
```
