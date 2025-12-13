# Mining Management System API

> **Backend API untuk Sistem Manajemen Pertambangan Batubara**

Sistem ini menyediakan RESTful API untuk mengelola operasi tambang batubara, termasuk manajemen user, equipment, production planning, weather monitoring, road condition, dan shipping schedules.

## 📋 Daftar Isi

- [Quick Start](#-quick-start)
- [Frontend Integration Guide](#-frontend-integration-guide)
- [API Endpoints](#-api-endpoints)
- [Instalasi & Setup](#-instalasi--setup)
- [Environment Variables](#-environment-variables)
- [Tech Stack](#-tech-stack)

---

## 🚀 Quick Start

```bash
# 1. Clone & Install
git clone <repository-url>
cd miningv
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

# 3. Run server
npm start
# Server berjalan di http://localhost:5000
```

---

## 🔌 Frontend Integration Guide

### Base URL

```
Development: http://localhost:5000
Production:  https://your-production-domain.com
```

### API Service Setup (Recommended)

Buat file `api.js` untuk centralized API calls:

```javascript
// api.js - API Service untuk Frontend

const BASE_URL = 'http://localhost:5000';

// Helper untuk menyimpan dan mengambil token
const TokenService = {
  getToken: () => localStorage.getItem('accessToken'),
  setToken: (token) => localStorage.setItem('accessToken', token),
  removeToken: () => localStorage.removeItem('accessToken'),
  getUserId: () => localStorage.getItem('userId'),
  setUserId: (id) => localStorage.setItem('userId', id),
};

// Fetch wrapper dengan error handling
async function fetchAPI(endpoint, options = {}) {
  const token = TokenService.getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw { status: response.status, message: data.message || 'Request failed' };
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export { fetchAPI, TokenService, BASE_URL };
```

---

### 🔐 Authentication

#### 1. Register User

```javascript
// POST /register
async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'securePassword123'
    })
  });
  return response.json();
}

// Response:
// { "message": "User created", "error": false, "data": { "id": "uuid", ... } }
```

#### 2. Login & Store Token

```javascript
// POST /login
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const result = await response.json();
  
  if (!result.error) {
    // 🔑 Simpan token untuk request selanjutnya
    localStorage.setItem('accessToken', result.data.accessToken);
    localStorage.setItem('userId', result.data.id);
  }
  
  return result;
}

// Response:
// {
//   "message": "Login Success",
//   "error": false,
//   "data": {
//     "id": "user-uuid",
//     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
//     "role": "Mine Planner"
//   }
// }
```

#### 3. Authenticated Request

```javascript
// Request dengan Authorization header
async function getProtectedData(endpoint) {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ⬅️ Wajib untuk endpoint protected
    }
  });
  
  return response.json();
}
```

#### 4. Logout

```javascript
// DELETE /logout/{id}
async function logout() {
  const userId = localStorage.getItem('userId');
  
  await fetch(`${BASE_URL}/logout/${userId}`, {
    method: 'DELETE'
  });
  
  // Clear stored data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userId');
}
```

---

### 📊 Data Fetching Examples

#### Get All Mines (with Pagination)

```javascript
// GET /mines?limit=10&cursor=xxx
async function getMines(limit = 10, cursor = null) {
  const token = localStorage.getItem('accessToken');
  let url = `${BASE_URL}/mines?limit=${limit}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}

// Response:
// {
//   "message": "Mines retrieved",
//   "error": false,
//   "limit": 10,
//   "nextCursor": "2025-11-27|MINE005",  // Gunakan untuk page selanjutnya
//   "total": 50,
//   "data": [{ "mine_id": "MINE001", "mine_name": "Site A", ... }]
// }
```

#### Get All Data (No Pagination)

```javascript
// GET /mines?all=true
async function getAllMines() {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${BASE_URL}/mines?all=true`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}
```

#### Get Equipment by ID

```javascript
// GET /equipments/{id}
async function getEquipmentById(equipmentId) {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${BASE_URL}/equipments/${equipmentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}
```

---

### ✏️ Create & Update Examples

#### Create Equipment (POST)

```javascript
// POST /equipments
async function createEquipment(equipmentData) {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${BASE_URL}/equipments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      equipment_type: 'Excavator',
      equipment_capacity: 500,
      operational_status: 'Active',
      mine_id: 'MINE001'
    })
  });
  
  return response.json();
}
```

#### Update Production Plan (PUT)

```javascript
// PUT /production-plans/{id}
async function updateProductionPlan(planId, updateData) {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${BASE_URL}/production-plans/${planId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      target_production: 15000,
      actual_production: 14500,
      status: 'In Progress'
    })
  });
  
  return response.json();
}
```

---

### 🤖 AI Endpoints

#### Weather Forecast

```javascript
// POST /ai/weather/forecast
async function forecastWeather(data) {
  const response = await fetch(`${BASE_URL}/ai/weather/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mine_id: 'MINE001',
      days: 7
    })
  });
  
  return response.json();
}
```

#### Production Prediction

```javascript
// POST /ai/production/predict
async function predictProduction(inputData) {
  const response = await fetch(`${BASE_URL}/ai/production/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      temperature: 28.5,
      humidity: 75,
      rainfall: 2.5,
      equipment_count: 10,
      road_condition: 'Good'
    })
  });
  
  return response.json();
}
```

#### Chat with RAG (Database Context)

```javascript
// POST /ai/rag/chat
async function chatWithRAG(message, history = []) {
  const response = await fetch(`${BASE_URL}/ai/rag/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Bagaimana kondisi jalan di MINE001?',
      conversation_history: history,
      include_rag_context: true
    })
  });
  
  return response.json();
}
```

---

### 📱 React Hook Example

```javascript
// hooks/useAPI.js
import { useState, useCallback } from 'react';

const BASE_URL = 'http://localhost:5000';

export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...options,
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message);
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
}

// Usage in Component:
// const { request, loading, error } = useAPI();
// const mines = await request('/mines?limit=10');
```

---

### ⚠️ Error Handling

```javascript
async function safeAPICall(endpoint, options) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    switch (response.status) {
      case 401:
        // Token expired - redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        break;
      case 403:
        alert('Anda tidak memiliki akses ke fitur ini');
        break;
      case 404:
        alert('Data tidak ditemukan');
        break;
      case 500:
        alert('Terjadi kesalahan server');
        break;
    }
    
    return data;
  } catch (networkError) {
    alert('Tidak dapat terhubung ke server');
    throw networkError;
  }
}
```

---

## 📖 API Endpoints

### Authentication & User Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register user baru | Public |
| POST | `/login` | Login & dapatkan token | Public |
| DELETE | `/logout/{id}` | Logout user | Public |
| GET | `/users/{id}` | Get user profile | Required |
| PUT | `/users/{id}` | Update user profile | Required |
| PUT | `/users/{id}/role` | Update user role | Admin only |
| DELETE | `/users/{id}` | Delete user | Required |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password | Public |

### Mine Operations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/mines` | Get all mines (paginated) | Required |
| GET | `/mines/{id}` | Get mine by ID | Required |
| GET | `/equipments` | Get all equipments | Mine Planner |
| GET | `/equipments/{id}` | Get equipment by ID | Mine Planner |
| POST | `/equipments` | Create equipment | Mine Planner |
| PUT | `/equipments/{id}` | Update equipment | Mine Planner |
| GET | `/effective-capacity` | Get capacity data | Mine Planner |
| POST | `/effective-capacity` | Create capacity data | Mine Planner |
| PUT | `/effective-capacity/{id}` | Update capacity | Mine Planner |
| GET | `/production-constraints` | Get constraints | Mine Planner |
| POST | `/production-constraints` | Create constraint | Mine Planner |
| GET | `/production-plans` | Get production plans | Required |
| POST | `/production-plans` | Create plan | Mine Planner |
| PUT | `/production-plans/{id}` | Update plan | Mine Planner |
| GET | `/weather` | Get weather data | Required |
| GET | `/roads` | Get road conditions | Required |
| PUT | `/roads/{id}` | Update road | Mine Planner |
| GET | `/shipping-schedules` | Get schedules | Shipping Planner |
| GET | `/shipping-schedules/{id}` | Get schedule by ID | Shipping Planner |
| POST | `/shipping-schedules` | Create schedule | Shipping Planner |
| PUT | `/shipping-schedules/{id}` | Update schedule | Shipping Planner |

### AI Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/health` | Check AI service health |
| POST | `/ai/weather/forecast` | Forecast weather |
| POST | `/ai/weather/classify` | Classify weather condition |
| POST | `/ai/capacity/predict` | Predict effective capacity |
| POST | `/ai/production/predict` | Predict production output |
| POST | `/ai/recommendations` | Get AI recommendations |
| GET | `/ai/llm/status` | Check LLM status |
| POST | `/ai/llm/recommend` | LLM recommendations |
| POST | `/ai/llm/chat` | Chat with LLM |
| GET | `/ai/rag/health` | RAG system health |
| GET | `/ai/rag/stats` | RAG statistics |
| POST | `/ai/rag/chat` | Chat with database context |
| POST | `/ai/rag/refresh` | Refresh RAG embeddings |

---

## 📄 Pagination

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `limit` | Items per page (default: 20) | `?limit=10` |
| `cursor` | Cursor untuk page berikutnya | `?cursor=2025-11-27\|ID123` |
| `start` | Filter tanggal mulai | `?start=2025-01-01` |
| `end` | Filter tanggal akhir | `?end=2025-12-31` |
| `all` | Get semua data | `?all=true` |

### Response Format

```json
{
  "message": "Success",
  "error": false,
  "limit": 20,
  "nextCursor": "2025-11-27|ID123",
  "total": 150,
  "data": [...]
}
```

---

## 🔍 Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "error": false,
  "data": { ... }
}
```

### Error Response

```json
{
  "message": "Error description",
  "error": true
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource dibuat |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Token tidak valid |
| 403 | Forbidden - Tidak punya akses |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Server Error |

---

## 📦 Instalasi & Setup

### Prerequisites

- Node.js v14+
- MySQL 5.7+
- npm atau yarn

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd miningv

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# 4. Run development server
npm start
# Server berjalan di http://localhost:5000
```

---

## 🔧 Environment Variables

Buat file `.env` dengan konfigurasi:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=miningv

# JWT
SECRET_KEY=your-super-secret-jwt-key

# Application
BASE_URL=http://localhost:5000
NODE_ENV=development

# Email (untuk password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# AI Service (optional)
AI_SERVICE_URL=http://localhost:5001
OPENAI_API_KEY=sk-your-openai-key
```

> ⚠️ **Jangan commit file `.env` ke repository!**

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Hapi.js v21
- **Database**: MySQL2
- **Authentication**: JWT
- **Password Hashing**: bcrypt
- **Email**: Nodemailer + MJML
- **AI/ML**: Python Flask + scikit-learn

---

## 👥 Authors

Backend Development Team

---

**Happy Coding! 🚀**