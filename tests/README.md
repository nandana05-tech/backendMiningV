# Testing Guide

Panduan pengujian untuk semua endpoint di aplikasi Mining Management System.

## Setup

Semua dependencies sudah terinstall. Konfigurasi Jest ada di `jest.config.js`.

## Struktur Test

```
tests/
├── setup.js                 # Konfigurasi global test
├── helpers/
│   └── test-helpers.js     # Utility functions untuk testing
├── user.test.js            # Test untuk user management & authentication
├── equipment.test.js       # Test untuk equipment management
├── mine.test.js            # Test untuk mine management
└── operations.test.js      # Test untuk production plans, weather, roads, shipping
```

## Menjalankan Test

### Jalankan semua test
```bash
npm test
```

### Jalankan test dalam watch mode (untuk development)
```bash
npm run test:watch
```

### Jalankan test dengan coverage report
```bash
npm run test:coverage
```

### Jalankan test spesifik
```bash
# Test user management saja
npm test user.test.js

# Test equipment saja
npm test equipment.test.js

# Test mine saja
npm test mine.test.js

# Test operations saja
npm test operations.test.js
```

## Coverage Test

Test mencakup semua endpoint di `src/routes.js`:

### ✅ User Management (8 endpoints)
- `POST /register` - Register user baru
- `POST /login` - Login user
- `DELETE /logout/{id}` - Logout user
- `GET /users/{id}` - Get user profile
- `PUT /users/{id}` - Update user profile
- `PUT /users/{id}/role` - Update user role (admin only)
- `DELETE /users/{id}` - Delete user
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### ✅ Equipment Management (4 endpoints)
- `GET /equipments` - Get all equipments (with pagination)
- `GET /equipments/{id}` - Get equipment by ID
- `POST /equipments` - Create new equipment
- `PUT /equipments/{id}` - Update equipment

### ✅ Mine Management (2 endpoints)
- `GET /mines` - Get all mines (with pagination)
- `GET /mines/{id}` - Get mine by ID

### ✅ Production Plans (3 endpoints)
- `GET /production-plans` - Get all production plans
- `POST /production-plans` - Create production plan
- `PUT /production-plans/{id}` - Update production plan

### ✅ Weather (1 endpoint)
- `GET /weather` - Get weather data

### ✅ Road Conditions (2 endpoints)
- `GET /roads` - Get road conditions
- `PUT /roads/{id}` - Update road condition

### ✅ Shipping Schedules (4 endpoints)
- `GET /shipping-schedules` - Get all shipping schedules
- `GET /shipping-schedules/{id}` - Get shipping schedule by ID
- `POST /shipping-schedules` - Create shipping schedule
- `PUT /shipping-schedules/{id}` - Update shipping schedule

## Catatan Penting

### Mocking
Semua test menggunakan mock untuk:
- **Database** (`pool.query`) - Tidak memerlukan database aktif
- **Authentication Middleware** - Simulasi verifikasi token
- **Email Service** - Tidak mengirim email real
- **Bcrypt & JWT** - Password hashing dan token generation

### Test Data
Test fixtures tersedia di `tests/helpers/test-helpers.js` untuk data konsisten.

### Environment Variables
Environment variables untuk testing sudah dikonfigurasi di `tests/setup.js`.

## Troubleshooting

### Jest not found
Jika mendapat error "jest is not recognized", install dependencies:
```bash
npm install
```

### Test timeout
Jika test timeout, naikkan timeout di `jest.config.js`:
```javascript
testTimeout: 20000  // Default: 10000
```

### Mock issues
Jika mock tidak bekerja, pastikan `jest.clearAllMocks()` dipanggil di `beforeEach()`.
