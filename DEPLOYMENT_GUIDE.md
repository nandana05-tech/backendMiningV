# 🚀 Panduan Deployment - Node.js Backend & Python AI Service

## 📋 Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT OPTIONS                            │
├─────────────────────────────────────────────────────────────────┤
│  1. VPS/Cloud VM    → DigitalOcean, AWS EC2, Google Cloud       │
│  2. Platform-as-a-Service → Heroku, Railway, Render             │
│  3. Container       → Docker + Docker Compose                    │
│  4. Kubernetes      → AWS EKS, Google GKE, DigitalOcean K8s     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Rekomendasi untuk Pemula

| Complexity | Platform | Biaya | Best For |
|------------|----------|-------|----------|
| ⭐ Easy | **Railway** | $5-20/mo | Quick deploy, auto-scaling |
| ⭐ Easy | **Render** | $7-25/mo | Free tier available |
| ⭐⭐ Medium | **DigitalOcean Droplet** | $6-24/mo | Full control, affordable |
| ⭐⭐ Medium | **Docker Compose** | Varies | Portability, consistency |
| ⭐⭐⭐ Advanced | **Kubernetes** | $50+/mo | High availability, scaling |

---

# 📦 Option 1: Docker Compose (Recommended for Learning)

## **Langkah 1: Buat Dockerfile untuk Node.js**

**File: `Dockerfile.node`**
```dockerfile
# Node.js Backend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY .env.production ./.env

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
```

## **Langkah 2: Buat Dockerfile untuk Python**

**File: `Dockerfile.python`**
```dockerfile
# Python AI Service
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY src/Modelling/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and models
COPY src/Modelling/ ./

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "api_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

## **Langkah 3: Buat Docker Compose**

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  # Node.js Backend
  backend:
    build:
      context: .
      dockerfile: Dockerfile.node
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PYTHON_AI_SERVICE_URL=http://ai-service:8000
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=your_password
      - DB_NAME=miningv
    depends_on:
      - ai-service
      - mysql
    networks:
      - miningv-network

  # Python AI Service
  ai-service:
    build:
      context: .
      dockerfile: Dockerfile.python
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    networks:
      - miningv-network

  # MySQL Database
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=your_password
      - MYSQL_DATABASE=miningv
    volumes:
      - mysql-data:/var/lib/mysql
      - ./miningv.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - miningv-network

networks:
  miningv-network:
    driver: bridge

volumes:
  mysql-data:
```

## **Langkah 4: Deploy dengan Docker**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

# ☁️ Option 2: DigitalOcean Droplet (VPS)

## **Langkah 1: Buat Droplet**

1. Login ke [DigitalOcean](https://cloud.digitalocean.com)
2. Create Droplet → Ubuntu 22.04 → $12/mo (2GB RAM recommended)
3. Add SSH key untuk akses

## **Langkah 2: Setup Server**

```bash
# SSH ke server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx
```

## **Langkah 3: Clone & Setup Project**

```bash
# Clone repository
cd /var/www
git clone https://github.com/your-username/miningv.git
cd miningv

# Setup Node.js
npm install --production
cp .env.example .env
nano .env  # Edit environment variables

# Setup Python
cd src/Modelling
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## **Langkah 4: Configure PM2**

**File: `ecosystem.config.js`**
```javascript
module.exports = {
  apps: [
    {
      name: 'miningv-backend',
      script: 'src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'miningv-ai',
      script: '/var/www/miningv/src/Modelling/venv/bin/uvicorn',
      args: 'api_service:app --host 0.0.0.0 --port 8000',
      cwd: '/var/www/miningv/src/Modelling',
      interpreter: 'none'
    }
  ]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## **Langkah 5: Configure Nginx**

**File: `/etc/nginx/sites-available/miningv`**
```nginx
# Node.js Backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Python AI Service (optional external access)
server {
    listen 80;
    server_name ai.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/miningv /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## **Langkah 6: Setup SSL (HTTPS)**

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d api.yourdomain.com -d ai.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

---

# 🚂 Option 3: Railway (Easiest)

## **Langkah 1: Prepare Project Structure**

```
miningv/
├── backend/              # Node.js
│   ├── src/
│   ├── package.json
│   ├── Procfile
│   └── railway.json
└── ai-service/           # Python
    ├── api_service.py
    ├── model_loader.py
    ├── Hasil Model/
    ├── requirements.txt
    ├── Procfile
    └── railway.json
```

## **Langkah 2: Create Procfiles**

**backend/Procfile:**
```
web: npm start
```

**ai-service/Procfile:**
```
web: uvicorn api_service:app --host 0.0.0.0 --port $PORT
```

## **Langkah 3: Deploy to Railway**

1. Login ke [Railway](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Deploy Python AI service dulu
4. Copy AI service URL
5. Deploy Node.js dengan environment variable:
   ```
   PYTHON_AI_SERVICE_URL=https://your-ai-service.railway.app
   ```

---

# 🎨 Option 4: Render (Free Tier Available)

## **Langkah 1: Create render.yaml**

**File: `render.yaml`**
```yaml
services:
  # Node.js Backend
  - type: web
    name: miningv-backend
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PYTHON_AI_SERVICE_URL
        fromService:
          type: web
          name: miningv-ai
          property: host

  # Python AI Service
  - type: web
    name: miningv-ai
    env: python
    plan: starter
    buildCommand: pip install -r src/Modelling/requirements.txt
    startCommand: cd src/Modelling && uvicorn api_service:app --host 0.0.0.0 --port $PORT
```

## **Langkah 2: Deploy**

1. Connect GitHub repo ke Render
2. Render akan otomatis deploy dari `render.yaml`
3. Wait for deploy complete

---

# ⚠️ Pre-Deployment Checklist

## **1. Environment Variables**

```bash
# Production .env
NODE_ENV=production
PORT=5000

# Database (use production database)
DB_HOST=your_production_db_host
DB_USER=your_db_user
DB_PASSWORD=strong_password_here
DB_NAME=miningv

# AI Service URL (updated after AI service deployed)
PYTHON_AI_SERVICE_URL=https://your-ai-service-url.com
```

## **2. Security Checklist**

- [ ] Remove all console.log with sensitive data
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your frontend domain
- [ ] Add rate limiting
- [ ] Use HTTPS only
- [ ] Secure database credentials
- [ ] Add authentication to AI endpoints (if needed)

## **3. Update CORS in Python**

**api_service.py:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://api.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## **4. Model Files**

Pastikan model files (.pkl) termasuk dalam deployment:
- `Hasil Model/effcap_ranfor_regression.pkl`
- `Hasil Model/encoders_efcap.pkl`
- `Hasil Model/model_production_plan.pkl`
- `Hasil Model/encoders_prodplan.pkl`
- `Hasil Model/xgb_weather_classification.pkl`
- `Hasil Model/*.pkl` (semua weather forecast models)

---

# 🔍 Post-Deployment Testing

## **1. Health Checks**

```bash
# Check Node.js
curl https://api.yourdomain.com/api/health

# Check AI Service
curl https://api.yourdomain.com/ai/health
```

## **2. Test AI Endpoints**

```bash
# Test Capacity Prediction
curl -X POST https://api.yourdomain.com/ai/capacity/predict \
  -H "Content-Type: application/json" \
  -d '{
    "mine_id": "MINE_1",
    "equipment_id": "EQ003",
    "equipment_type": "Excavator",
    "road_condition": "Good",
    "weather_condition": "Cerah",
    "availability_pct": 85
  }'
```

---

# 📊 Monitoring & Logging

## **1. PM2 Monitoring**

```bash
pm2 monit          # Real-time monitoring
pm2 logs           # View logs
pm2 status         # Check status
```

## **2. Add Logging Service**

- **Logtail** (free tier)
- **Papertrail** 
- **Datadog**

## **3. Uptime Monitoring**

- **UptimeRobot** (free)
- **Better Uptime**
- **Pingdom**

---

# 💰 Cost Estimation

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| VPS (2GB RAM) | DigitalOcean | $12 |
| Managed MySQL | DigitalOcean | $15 |
| Domain | Namecheap | $1 |
| SSL | Let's Encrypt | Free |
| **Total** | | **~$28/month** |

**Alternative (Railway/Render):**
| Service | Monthly Cost |
|---------|--------------|
| Node.js (Starter) | $7 |
| Python AI (Starter) | $7 |
| Database | $7-15 |
| **Total** | **~$21-29/month** |

---

# 🎓 Learning Path

## **Week 1-2: Docker Basics**
1. Install Docker Desktop
2. Learn Dockerfile basics
3. Practice with docker-compose
4. Deploy locally with Docker

## **Week 3-4: Cloud Fundamentals**
1. Create DigitalOcean account
2. Setup basic VPS
3. Configure Nginx
4. Setup SSL/HTTPS

## **Week 5-6: CI/CD**
1. Learn GitHub Actions
2. Setup auto-deployment
3. Implement testing pipeline

## **Resources:**
- [Docker Documentation](https://docs.docker.com)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)
- [Railway Documentation](https://docs.railway.app)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)

---

# ✅ Summary

**Untuk Pemula:**
1. Start dengan **Docker Compose** locally
2. Deploy ke **Railway** atau **Render** (mudah)
3. Upgrade ke **DigitalOcean VPS** saat butuh kontrol lebih

**Production Ready Checklist:**
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] SSL/HTTPS enabled
- [ ] CORS configured
- [ ] Logging enabled
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] CI/CD pipeline

**Next Steps:**
1. Pilih platform sesuai budget dan skill
2. Follow langkah-langkah di atas
3. Test thoroughly sebelum go-live
4. Setup monitoring dan alerts

---

**Tips:**
- 🔒 Jangan commit `.env` ke Git
- 📦 Gunakan `.gitignore` untuk exclude sensitive files
- 🔄 Setup auto-backup database
- 📈 Monitor resource usage
- 🚨 Setup alerting untuk downtime
