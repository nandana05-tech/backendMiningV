# 🚀 Deployment Guide - Mining AI System

Panduan lengkap untuk deploy **Node.js Backend** + **Python AI Service** + **MySQL Database** menggunakan Docker.

---

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) atau Docker Engine (Linux)
- Docker Compose v2.0+
- Git

---

## ⚡ Quick Start (3 Langkah)

```bash
# 1. Copy environment file dan edit credentials
cp .env.example .env
notepad .env   # Edit dengan credentials Anda

# 2. Build dan jalankan SEMUA services
docker-compose up -d --build

# 3. Cek status
docker-compose ps
```

**Services yang berjalan:**
| Service | URL | Port |
|---------|-----|------|
| Node.js Backend API | http://localhost:5000 | 5000 |
| Python AI Service | http://localhost:8000 | 8000 |
| MySQL Database | localhost:3306 | 3306 |

---

## 📝 Langkah Demi Langkah

### Step 1: Setup Environment Variables

```bash
# Copy template
cp .env.example .env
```

Edit file `.env` dengan credentials Anda:

```env
# ============ WAJIB DIISI ============

# Database Configuration
DB_ROOT_PASSWORD=your-strong-root-password
DB_NAME=miningv
DB_USER=miningv_user
DB_PASSWORD=your-strong-db-password

# JWT Secret (untuk authentication)
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars

# OpenAI API Key (untuk AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# ============ OPSIONAL ============

# Email (untuk password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

> ⚠️ **PENTING**: Jangan gunakan password default di production!

---

### Step 2: Build Docker Images

```bash
# Build semua images
docker-compose build

# Atau build dengan verbose output
docker-compose build --progress=plain
```

---

### Step 3: Jalankan Semua Services

```bash
# Start semua services di background
docker-compose up -d

# Lihat logs realtime
docker-compose logs -f
```

---

### Step 4: Verifikasi Deployment

```bash
# Cek status containers
docker-compose ps

# Expected output:
# NAME                 STATUS              PORTS
# miningv-mysql        running (healthy)   0.0.0.0:3306->3306/tcp
# miningv-ai-service   running (healthy)   0.0.0.0:8000->8000/tcp
# miningv-backend      running (healthy)   0.0.0.0:5000->5000/tcp
```

**Test Endpoints:**

```bash
# Test Node.js Backend
curl http://localhost:5000/

# Test Python AI Service
curl http://localhost:8000/health

# Test AI RAG Health
curl http://localhost:5000/ai/rag/health
```

---

## 🔧 Configuration Files

### docker-compose.yml (Sudah Ada)

Project ini sudah memiliki `docker-compose.yml` yang sudah dikonfigurasi dengan:

- **mysql**: MySQL 8.0 database dengan auto-import schema
- **ai-service**: Python AI Service (FastAPI) di port 8000
- **backend**: Node.js Hapi.js Backend di port 5000

### Dockerfile untuk Node.js (Sudah Ada)

File `Dockerfile` di root folder untuk Node.js backend.

### Dockerfile untuk Python AI Service

Pastikan ada `Dockerfile` di folder `src/Modelling/` dengan konten:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dan install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories
RUN mkdir -p logs .embedding_cache

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "api_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 📋 Commands Reference

### Start & Stop

```bash
# Start semua services
docker-compose up -d

# Start service tertentu saja
docker-compose up -d backend
docker-compose up -d ai-service

# Stop semua services (data tetap ada)
docker-compose down

# Stop dan hapus volumes (⚠️ HAPUS DATA!)
docker-compose down -v

# Restart service tertentu
docker-compose restart backend
```

### Logs & Monitoring

```bash
# Lihat logs semua services
docker-compose logs -f

# Lihat logs service tertentu
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f mysql

# Lihat resource usage
docker stats
```

### Rebuild & Update

```bash
# Rebuild setelah code changes
docker-compose up -d --build

# Rebuild tanpa cache (full rebuild)
docker-compose build --no-cache
docker-compose up -d

# Pull latest base images
docker-compose pull
docker-compose up -d --build
```

### Database Operations

```bash
# Akses MySQL shell
docker-compose exec mysql mysql -u root -p miningv

# Backup database
docker-compose exec mysql mysqldump -u root -p miningv > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T mysql mysql -u root -p miningv < backup.sql

# Reset database (reimport schema)
docker-compose down -v
docker-compose up -d
```

### Execute Commands Inside Container

```bash
# Masuk ke shell backend
docker-compose exec backend sh

# Masuk ke shell ai-service
docker-compose exec ai-service bash

# Run command di ai-service
docker-compose exec ai-service python -c "print('Hello')"
```

---

## 🌐 Production Deployment

### Dengan Nginx Reverse Proxy

tambahkan di `docker-compose.yml`:

```yaml
  nginx:
    image: nginx:alpine
    container_name: miningv-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - miningv-network
    restart: unless-stopped
```

Buat file `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream ai_service {
        server ai-service:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Node.js Backend API
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Python AI Service (direct access jika diperlukan)
        location /ai-direct/ {
            rewrite ^/ai-direct/(.*) /$1 break;
            proxy_pass http://ai_service;
            proxy_set_header Host $host;
        }
    }
}
```

---

## 🔍 Troubleshooting

### Container tidak start

```bash
# Cek logs
docker-compose logs mysql
docker-compose logs ai-service
docker-compose logs backend

# Cek apakah port sudah dipakai
netstat -ano | findstr :5000
netstat -ano | findstr :8000
netstat -ano | findstr :3306
```

### Backend tidak bisa connect ke MySQL

```bash
# Tunggu MySQL ready
docker-compose logs mysql | grep "ready for connections"

# Atau restart backend setelah MySQL ready
docker-compose restart backend
```

### AI Service error "No module found"

```bash
# Rebuild AI service image
docker-compose build --no-cache ai-service
docker-compose up -d ai-service
```

### Reset semua dan mulai dari awal

```bash
# Stop semua containers
docker-compose down

# Hapus volumes (database data)
docker-compose down -v

# Hapus images
docker-compose down --rmi all

# Build ulang dari awal
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│                   (miningv-network)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                │
│  │   Node.js       │     │   Python AI     │                │
│  │   Backend       │ ───▶│   Service       |               │
│  │   (port 5000)   │     │   (port 8000)   │                │
│  └────────┬────────┘     └─────────────────┘                │
│           │                                                 │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │     MySQL       │                                        │
│  │   Database      │                                        │
│  │   (port 3306)   │                                        │
│  └─────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    localhost:5000  localhost:8000  localhost:3306
         │
         ▼
    ┌─────────────┐
    │  Frontend   │
    │  (React/    │
    │   Vue/etc)  │
    └─────────────┘
```

---

## 📁 File Structure untuk Docker

```
miningv/
├── docker-compose.yml      # Orchestration config
├── Dockerfile              # Node.js backend image
├── .env                    # Environment variables (jangan commit!)
├── .env.example            # Template environment
├── .dockerignore           # Files to exclude from build
├── nginx.conf              # (optional) Nginx config
├── src/
│   ├── Modelling/
│   │   ├── Dockerfile      # Python AI service image
│   │   ├── requirements.txt
│   │   ├── api_service.py
│   │   └── models/
│   ├── server.js
│   ├── routes.js
│   └── handlers/
└── miningv.sql             # Database schema (auto-imported)
```

---

## ✅ Checklist Sebelum Deploy ke Production

- [ ] Ubah semua password default di `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Gunakan SSL/HTTPS
- [ ] Setup backup database otomatis
- [ ] Configure firewall rules
- [ ] Setup monitoring (Grafana, Prometheus, etc.)
- [ ] Setup logging (ELK Stack, CloudWatch, etc.)

---

**Happy Deploying! 🐳**
