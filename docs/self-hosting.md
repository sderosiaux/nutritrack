# Self-Hosting NutriTrack

This guide covers deploying NutriTrack on a VPS or home server using Docker Compose.

---

## Overview

NutriTrack runs entirely via Docker Compose. There are no cloud dependencies. All data stays on your server.

**Services:**
- `app` — Next.js 15 application (port 3000 internally)
- `postgres` — PostgreSQL 16 database
- `redis` — Redis 7 (BullMQ job queue + session cache)
- `minio` — MinIO S3-compatible object storage (food photos)
- `nginx` — Reverse proxy (ports 80/443 externally)
- `ollama` — Optional: self-hosted vision LLM (profile: ollama)

---

## Requirements

- Linux VPS (Ubuntu 22.04+ recommended) with Docker & Docker Compose v2
- 2 GB RAM minimum (4 GB recommended with Ollama)
- 20 GB disk (for database + MinIO storage)
- A domain name pointing to your server (for SSL)

---

## Deployment Steps

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Re-login to apply group change
```

### 2. Clone the repository

```bash
git clone https://github.com/sderosiaux/nutritrack.git
cd nutritrack
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Required — generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-here

# Your domain
BETTER_AUTH_URL=https://nutritrack.yourdomain.com
NEXT_PUBLIC_APP_URL=https://nutritrack.yourdomain.com

# Change these from defaults!
POSTGRES_PASSWORD=your-db-password
MINIO_ACCESS_KEY=your-minio-user
MINIO_SECRET_KEY=your-minio-password
```

### 4. Configure nginx

Create the nginx config directory and SSL directory:

```bash
mkdir -p nginx/ssl
```

Create `nginx/nginx.conf`:

```nginx
events {
  worker_connections 1024;
}

http {
  server_tokens off;
  keepalive_timeout 65;

  # HTTP → HTTPS redirect
  server {
    listen 80;
    server_name nutritrack.yourdomain.com;
    return 301 https://$server_name$request_uri;
  }

  # HTTPS — main server
  server {
    listen 443 ssl http2;
    server_name nutritrack.yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    client_max_body_size 20M;

    location / {
      proxy_pass         http://app:3000;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade $http_upgrade;
      proxy_set_header   Connection 'upgrade';
      proxy_set_header   Host $host;
      proxy_set_header   X-Real-IP $remote_addr;
      proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }
  }
}
```

### 5. Obtain SSL certificate

Use Certbot (Let's Encrypt):

```bash
# Install certbot
sudo apt install certbot -y

# Get certificate (temporarily stop nginx if already running)
sudo certbot certonly --standalone \
  -d nutritrack.yourdomain.com \
  --agree-tos \
  --email admin@yourdomain.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/nutritrack.yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/nutritrack.yourdomain.com/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*
```

Auto-renew certificates (add to crontab):

```bash
0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/nutritrack.yourdomain.com/fullchain.pem /path/to/nutritrack/nginx/ssl/ && cp /etc/letsencrypt/live/nutritrack.yourdomain.com/privkey.pem /path/to/nutritrack/nginx/ssl/ && docker compose -f /path/to/nutritrack/docker-compose.prod.yml exec nginx nginx -s reload
```

### 6. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 7. Initialize the database

```bash
docker compose -f docker-compose.prod.yml exec app pnpm db:migrate
docker compose -f docker-compose.prod.yml exec app pnpm db:seed   # optional
```

### 8. Verify

```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# Test health endpoint
curl https://nutritrack.yourdomain.com/api/v1/health
# Expected: {"status":"ok"}
```

---

## Optional: Ollama (Local Vision)

To use self-hosted vision LLM for photo recognition:

```bash
# Start with Ollama profile
docker compose -f docker-compose.prod.yml --profile ollama up -d

# Pull a vision model
docker compose -f docker-compose.prod.yml exec ollama ollama pull llava

# Set in .env
VISION_PROVIDER=ollama
OLLAMA_URL=http://ollama:11434
```

Requires 4+ GB VRAM (GPU recommended) or 8 GB RAM (CPU inference, slow).

---

## Updating

```bash
# Pull latest code
git pull

# Rebuild and restart app
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app

# Run new migrations if any
docker compose -f docker-compose.prod.yml exec app pnpm db:migrate
```

---

## Backup

### Database backup

```bash
# Full backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U nutritrack nutritrack > backup_$(date +%Y%m%d).sql

# Restore
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U nutritrack nutritrack < backup_20260101.sql
```

### MinIO backup

```bash
# Copy all objects from MinIO to local
docker compose -f docker-compose.prod.yml exec minio \
  mc cp --recursive local/nutritrack /backup/minio/
```

Set up daily backups with cron + a backup rotation policy for your data retention needs.

---

## Monitoring

```bash
# View app logs
docker compose -f docker-compose.prod.yml logs -f app

# View all service status
docker compose -f docker-compose.prod.yml ps

# Resource usage
docker stats
```

---

## Troubleshooting

**App won't start:**
```bash
docker compose -f docker-compose.prod.yml logs app
# Check for missing env vars or migration failures
```

**Database connection refused:**
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U nutritrack
# Ensure postgres is healthy before app starts
```

**MinIO bucket missing:**
```bash
# Create bucket manually
docker compose -f docker-compose.prod.yml exec minio \
  mc mb local/nutritrack
```

**SSL certificate expired:**
```bash
certbot renew --quiet
# Then copy new certs and reload nginx (see auto-renew cron above)
```

---

## Environment Variables Reference

See [.env.example](../.env.example) for the full annotated list of all configuration options.

---

## Security Checklist

- [ ] `BETTER_AUTH_SECRET` is a random 32+ char string (not the default)
- [ ] `POSTGRES_PASSWORD` changed from default
- [ ] `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` changed from defaults
- [ ] Firewall blocks ports 3000, 5432, 6379, 9000 from external access (only 80/443 via nginx)
- [ ] SSL certificate is valid and auto-renewing
- [ ] Regular database backups scheduled
- [ ] Docker Compose set to `restart: unless-stopped` (already configured)
