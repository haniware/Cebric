# Docker Deployment Guide

This guide explains how to run the F1 Data application using Docker on both Windows and Linux.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose V2 (included with Docker Desktop)
- At least 2GB of available RAM
- At least 3GB of disk space

## Quick Start

### 1. Clone and Navigate to the Project

```bash
cd F1-data
```

### 2. Create Environment File

Copy the example environment file and customize it:

```bash
# Linux/macOS
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Windows (CMD)
copy .env.example .env
```

Edit `.env` and update the values, especially:
- `SESSION_SECRET` - Change to a random secret string (32+ characters)
- `APP_PORT` - Change if port 5000 is already in use

### 3. Build and Start the Application

```bash
docker-compose up -d
```

This will:
- Build the F1 Data application image
- Start the F1 Data application container
- Create a persistent volume for FastF1 cache data

### 4. Access the Application

**Application**: http://localhost:5000

### 5. View Logs

```bash
# View logs
docker-compose logs -f

# View logs with timestamps
docker-compose logs -f --timestamps

# View last 100 lines
docker-compose logs --tail=100
```

## Docker Commands

### Stop the Application

```bash
docker-compose down
```

### Stop and Remove Volumes (Delete Cache Data)

```bash
docker-compose down -v
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

### Restart the Application

```bash
docker-compose restart
```

### Access Application Shell

```bash
docker-compose exec app sh
```

### View Container Status

```bash
docker-compose ps
```

### View Resource Usage

```bash
docker stats f1-data-app
```

## Platform-Specific Notes

### Windows

#### Using PowerShell
All commands work as-is in PowerShell.

#### Using Command Prompt (CMD)
Replace `\` with `^` for line continuation if needed.

#### Using WSL2 (Recommended)
For best performance, use Docker Desktop with WSL2 backend and run commands from WSL2.

#### File Permissions
Windows doesn't have Unix file permissions. The application will run with default container permissions.

### Linux

#### Without Docker Compose
If docker-compose is not available, use the Docker Compose plugin:

```bash
docker compose up -d  # Note: 'docker compose' instead of 'docker-compose'
```

#### File Permissions
Ensure the current user can access Docker:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### SELinux (Fedora, RHEL, CentOS)
If using SELinux, you may need to adjust volume permissions:

```bash
chcon -Rt svirt_sandbox_file_t ./fastf1_cache
```

## Environment Variables

Key environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | production |
| `APP_PORT` | Application port | 5000 |
| `SESSION_SECRET` | Session encryption key | change-me-in-production |
| `FASTF1_CACHE_DIR` | FastF1 cache directory | /app/fastf1_cache |

## Data Persistence

The application uses one Docker volume:

- **fastf1_cache** - FastF1 telemetry data cache (persists race data between restarts)

### Clear Cache

If you experience issues with cached F1 data:

```bash
# Method 1: Delete and recreate volume
docker-compose down -v
docker-compose up -d

# Method 2: Clear cache inside container
docker-compose exec app rm -rf /app/fastf1_cache/*
docker-compose restart
```

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, change `APP_PORT` in `.env`:

```env
APP_PORT=3000
```

Then restart:

```bash
docker-compose down
docker-compose up -d
```

### Container Won't Start

Check logs for errors:

```bash
docker-compose logs
```

Common issues:
- Port conflict (change APP_PORT)
- Insufficient memory (increase Docker memory limit)
- Build errors (check Dockerfile syntax)

### Python/FastF1 Errors

The FastF1 library may need to download race data on first use:

```bash
# Check logs for download progress
docker-compose logs -f

# If cache is corrupted, clear it
docker-compose exec app rm -rf /app/fastf1_cache/*
docker-compose restart
```

### Out of Memory

Increase Docker memory allocation:
- **Docker Desktop**: Settings → Resources → Memory (increase to 4GB+)
- **Linux**: No limit by default, but check system resources

### Slow Build Times

Use BuildKit for faster builds:

```bash
# Linux/macOS
DOCKER_BUILDKIT=1 docker-compose build

# Windows PowerShell
$env:DOCKER_BUILDKIT=1; docker-compose build
```

### Health Check Failures

The application includes a health check endpoint. If it fails:

```bash
# Check if app is running
docker-compose ps

# Check logs
docker-compose logs app

# Manually test health endpoint
docker-compose exec app wget -O- http://localhost:5000/api/health
```

## Production Deployment

### Security Checklist

- [ ] Change `SESSION_SECRET` to a random string (32+ characters)
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS (use reverse proxy like Nginx or Traefik)
- [ ] Keep Docker images updated
- [ ] Implement log rotation
- [ ] Set up monitoring and alerts

### Recommended Reverse Proxy Setup

Use Nginx or Traefik as a reverse proxy with SSL/TLS:

```yaml
# Add to docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
```

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://app:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development Mode

To enable live code reloading, uncomment the volume mounts in `docker-compose.yml`:

```yaml
volumes:
  - ./client:/app/client
  - ./server:/app/server
  - ./python:/app/python
```

Then rebuild and use development mode:

```bash
docker-compose up -d --build
docker-compose exec app npm run dev
```

## Health Checks

The application includes a health check that runs every 30 seconds:

```bash
# View health status
docker-compose ps

# Manually test health endpoint
curl http://localhost:5000/api/health
```

## Container Resource Limits

To limit container resources, add to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Backup and Restore

### Backup FastF1 Cache

```bash
# Create backup
docker run --rm -v f1-data_fastf1_cache:/data -v $(pwd):/backup alpine tar czf /backup/fastf1_cache_backup.tar.gz -C /data .

# Restore backup
docker run --rm -v f1-data_fastf1_cache:/data -v $(pwd):/backup alpine tar xzf /backup/fastf1_cache_backup.tar.gz -C /data
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastF1 Documentation](https://docs.fastf1.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Check system resources: `docker stats`
4. Restart services: `docker-compose restart`
5. Rebuild from scratch: `docker-compose down -v && docker-compose up -d --build`
