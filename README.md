# HomeStop System Deployment Guide

HomeStop System is a Next.js App Router application using TypeScript, Prisma ORM, PostgreSQL, Clerk authentication, Node.js 20, and npm.

This repo is set up for two modes:

- Production on a VPS: Docker Compose runs the Next.js app and PostgreSQL. Host Nginx proxies public traffic to the app.
- Local development: Docker Compose can run a hot-reload development container and PostgreSQL.

## What Runs In Production

Production uses these pieces:

- `app`: the Next.js production server on internal port `3000`
- `postgres`: PostgreSQL 16 with a persistent Docker volume
- Host Nginx: listens on public port `80` and `443`, then proxies to `127.0.0.1:3000`

PostgreSQL is not published to the public internet. The app is bound to `127.0.0.1`, so it is reachable from the VPS itself and from Nginx, not directly from outside the server.

## Required Files

- `Dockerfile`: builds the production Next.js image and generates Prisma Client
- `docker-compose.yml`: production app and database containers
- `docker-compose.dev.yml`: local development with hot reload
- `docker-entrypoint.sh`: runs `prisma migrate deploy` before starting Next.js
- `.env.example`: documents required environment variables
- `deploy/nginx/homestop.conf`: Nginx reverse proxy template for the VPS

## Environment Variables

Create `.env` from the example:

```bash
cp .env.example .env
nano .env
```

Required production values:

```env
APP_CONTAINER_NAME=homestop-app
APP_PORT=3000
APP_NODE_MAX_OLD_SPACE_MB=768
NODE_ENV=production

POSTGRES_CONTAINER_NAME=homestop-postgres
POSTGRES_DB=homestop_system_db
POSTGRES_USER=homestop_user
POSTGRES_PASSWORD=use-a-long-random-password

DATABASE_URL=postgresql://homestop_user:use-a-long-random-password@postgres:5432/homestop_system_db

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_key
```

Important notes:

- Do not use `localhost` in the Docker database URL. Inside Docker Compose, the database host is `postgres`.
- Do not commit `.env` to GitHub.
- For production, use Clerk live keys, not test keys, unless you intentionally want a test deployment.

## Local Production Test

From the project folder:

```bash
docker compose up -d --build
```

Check containers:

```bash
docker compose ps
```

Check app logs:

```bash
docker compose logs -f app
```

Open locally:

```text
http://localhost:3000
```

If port `3000` is busy, set this in `.env`:

```env
APP_PORT=3300
```

Then rebuild:

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:3300
```

## Local Development

Use this for hot reload while coding:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open:

```text
http://localhost:3000
```

The development container mounts your source code, installs dependencies into Docker volumes, generates Prisma Client, runs migrations, and starts `next dev`.

## Testing Scanner On Phone With Ngrok

For local phone testing, start the app first:

```bash
npm run dev
```

In another terminal:

```bash
ngrok http 3000
```

Use the HTTPS URL from ngrok on your phone, for example:

```text
https://your-ngrok-domain.ngrok-free.app/sales/new-order
```

If Clerk login fails, add the ngrok URL in your Clerk dashboard under allowed origins/redirect URLs.

If Next.js dev mode blocks the ngrok host, add the ngrok hostname to `allowedDevOrigins` in `next.config.ts`, then restart `npm run dev`.

## Hostinger VPS Step By Step

These commands assume Ubuntu on the Hostinger VPS.

### 1. Point Your Domain To The VPS

In your domain DNS settings, create an A record:

```text
Type: A
Name: @
Value: YOUR_VPS_PUBLIC_IP
TTL: automatic
```

For `www`:

```text
Type: A
Name: www
Value: YOUR_VPS_PUBLIC_IP
TTL: automatic
```

DNS can take a few minutes to a few hours.

### 2. SSH Into The VPS

From your computer:

```bash
ssh root@YOUR_VPS_PUBLIC_IP
```

Update the server:

```bash
apt update && apt upgrade -y
```

### 3. Install Docker And Compose

```bash
apt install -y ca-certificates curl gnupg git ufw nginx
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify:

```bash
docker --version
docker compose version
```

### 4. Configure Firewall

Allow SSH, HTTP, and HTTPS:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Do not open PostgreSQL port `5432` publicly.

### 5. Clone The Project

Use your GitHub repository URL:

```bash
cd /opt
git clone YOUR_GITHUB_REPO_URL homestop-system-production
cd /opt/homestop-system-production
```

### 6. Create Production `.env`

```bash
cp .env.example .env
nano .env
```

Use strong values:

```env
APP_CONTAINER_NAME=homestop-app
APP_PORT=3000
APP_NODE_MAX_OLD_SPACE_MB=768
NODE_ENV=production

POSTGRES_CONTAINER_NAME=homestop-postgres
POSTGRES_DB=homestop_system_db
POSTGRES_USER=homestop_user
POSTGRES_PASSWORD=PASTE_A_LONG_RANDOM_PASSWORD_HERE

DATABASE_URL=postgresql://homestop_user:PASTE_A_LONG_RANDOM_PASSWORD_HERE@postgres:5432/homestop_system_db

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_key_here
```

Generate a password if needed:

```bash
openssl rand -base64 32
```

### 7. Start The Containers

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
```

Check app logs:

```bash
docker compose logs -f app
```

You should see Prisma migrations run:

```text
Running Prisma migrations...
No pending migrations to apply.
Starting HomeStop application...
```

If migrations fail, the app will not start. Fix the error shown in logs first.

### 8. Test The App On The VPS Itself

From the VPS:

```bash
curl -I http://127.0.0.1:3000
```

A redirect from Clerk is okay. A connection error means the app is not listening or the container is unhealthy.

### 9. Configure Nginx Reverse Proxy

Copy the provided template:

```bash
cp /opt/homestop-system-production/deploy/nginx/homestop.conf /etc/nginx/sites-available/homestop
nano /etc/nginx/sites-available/homestop
```

Replace:

```text
YOUR_DOMAIN_OR_SERVER_IP
```

With your domain, for example:

```text
homestop.example.com
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/homestop /etc/nginx/sites-enabled/homestop
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Open:

```text
http://your-domain.com
```

### 10. Enable HTTPS With Certbot

Install Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Issue the certificate:

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

If you do not use `www`, omit it:

```bash
certbot --nginx -d your-domain.com
```

Test auto-renewal:

```bash
certbot renew --dry-run
```

Now open:

```text
https://your-domain.com
```

### 11. Configure Clerk For Production

In the Clerk dashboard, add your production URL to allowed origins and redirect URLs.

Use:

```text
https://your-domain.com
https://www.your-domain.com
```

If you are using Clerk test keys, configure the test instance. If you are using live keys, configure the production instance.

## Future Deployments

After pushing changes to GitHub, SSH into the VPS:

```bash
ssh root@YOUR_VPS_PUBLIC_IP
cd /opt/homestop-system-production
git pull
docker compose up -d --build
```

This rebuilds the app image, keeps the PostgreSQL volume, and runs pending Prisma migrations automatically.

Check logs after every deployment:

```bash
docker compose logs -f app
```

## Common Commands

View containers:

```bash
docker compose ps
```

View all logs:

```bash
docker compose logs -f
```

View only app logs:

```bash
docker compose logs -f app
```

View only database logs:

```bash
docker compose logs -f postgres
```

Restart the app:

```bash
docker compose restart app
```

Restart everything:

```bash
docker compose restart
```

Stop containers:

```bash
docker compose down
```

Start existing containers:

```bash
docker compose up -d
```

Rebuild from scratch:

```bash
docker compose build --no-cache
docker compose up -d
```

## Prisma Commands

Run production migrations manually:

```bash
docker compose exec app npx prisma migrate deploy
```

Generate Prisma Client manually:

```bash
docker compose exec app npx prisma generate
```

Open database shell:

```bash
docker compose exec postgres psql -U homestop_user -d homestop_system_db
```

## PostgreSQL Backups

Create a backup:

```bash
cd /opt/homestop-system-production
mkdir -p backups
docker compose exec -T postgres pg_dump -U homestop_user -d homestop_system_db > backups/homestop-$(date +%F-%H%M).sql
```

List backups:

```bash
ls -lh backups
```

Copy a backup from VPS to your computer:

```bash
scp root@YOUR_VPS_PUBLIC_IP:/opt/homestop-system-production/backups/homestop-YYYY-MM-DD-HHMM.sql .
```

## PostgreSQL Restore

Upload the backup to the VPS if needed:

```bash
scp homestop-backup.sql root@YOUR_VPS_PUBLIC_IP:/opt/homestop-system-production/backups/
```

Stop the app before restoring:

```bash
cd /opt/homestop-system-production
docker compose stop app
docker compose exec -T postgres psql -U homestop_user -d homestop_system_db < backups/homestop-backup.sql
docker compose start app
```

## Resource Settings For 4 GB VPS

The production Compose file is tuned conservatively:

- App memory limit: `1024m`
- App Node heap: `768 MB`
- App CPU limit: `1.0`
- PostgreSQL memory limit: `768m`
- PostgreSQL CPU limit: `0.75`
- PostgreSQL `max_connections`: `50`
- PostgreSQL `shared_buffers`: `128MB`
- Docker log rotation: `10m` per file, `3` files

This leaves memory for Ubuntu, Docker, Nginx, and build operations.

During `docker compose up -d --build`, CPU and memory can temporarily rise because Next.js is compiling. That is normal. If the VPS struggles during builds, add swap.

## Add Swap On Small VPS

Check current swap:

```bash
free -h
```

Create a 2 GB swap file:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Verify:

```bash
free -h
```

## Debug Internal Server Error

Start with logs:

```bash
cd /opt/homestop-system-production
docker compose logs --tail=200 app
docker compose logs --tail=200 postgres
```

Most common causes:

- `DATABASE_URL` points to `localhost` instead of `postgres`
- Wrong `POSTGRES_PASSWORD`
- Migrations failed
- Clerk keys are missing or from the wrong Clerk environment
- The domain is not configured in Clerk allowed origins/redirect URLs
- The app was rebuilt without required build-time public environment variables

Check environment inside the app container without printing secrets:

```bash
docker compose exec app sh -lc 'node -e "console.log({node:process.version, db:!!process.env.DATABASE_URL, clerkPublic:!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, clerkSecret:!!process.env.CLERK_SECRET_KEY})"'
```

Check Prisma migration status:

```bash
docker compose exec app npx prisma migrate status
```

Check database health:

```bash
docker compose exec postgres pg_isready -U homestop_user -d homestop_system_db
```

## Important Safety Notes

- Never run `docker compose down -v` on production unless you intentionally want to delete the PostgreSQL volume.
- Keep PostgreSQL private. Do not publish port `5432` from production Compose.
- Keep `.env` only on the VPS and never commit it.
- Back up before deploying database schema changes.
