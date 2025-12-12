# Dokumentasi API (Frontend)

Dokumentasi ini merinci cara menggunakan API dari sisi frontend.

> **Base URL**: Seluruh endpoint menggunakan URL dasar: `http://localhost:5000`

---

## 🔐 Autentikasi

Sebagian besar endpoint pada API ini memerlukan autentikasi menggunakan **Bearer Token** (JWT).# Mining Management System API

> **Backend API untuk Sistem Manajemen Pertambangan Batubara**

Sistem ini menyediakan RESTful API untuk mengelola operasi tambang batubara, termasuk manajemen user, equipment, production planning, weather monitoring, road condition, dan shipping schedules.

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Instalasi & Setup](#-instalasi--setup)
- [Struktur Project](#-struktur-project)
- [Environment Variables](#-environment-variables)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Authentication & Authorization](#-authentication--authorization)
- [Contributing](#-contributing)

---

## 🚀 Fitur Utama

### User Management
- ✅ Registrasi & Login dengan JWT
- ✅ Role-based access control (Admin, Mine Planner, Shipping Planner)
- ✅ Password reset dengan email verification
- ✅ Profile management

### Mine Operations
- ✅ Mine master data management
- ✅ Equipment inventory tracking
- ✅ Effective capacity calculation
- ✅ Production planning & constraints
- ✅ Weather data monitoring
- ✅ Road condition tracking
- ✅ Shipping schedule management

### Features
- 📄 Comprehensive pagination support
- 🔐 JWT-based authentication
- 📧 Email notifications (password reset)
- 🧪 Complete test coverage
- 📊 RESTful API design

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Hapi.js v21
- **Database**: MySQL2
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer + MJML templates
- **Testing**: Jest
- **Linting**: ESLint (Dicoding Academy config)
- **Dev Tools**: Nodemon

---

## 📦 Instalasi & Setup

### Prerequisites

- Node.js (v14 atau lebih baru)
- MySQL (v5.7 atau lebih baru)
- npm atau yarn

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd tpdbKos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   # Import database schema
   mysql -u root -p < miningv.sql
   ```

4. **Configure environment**
   ```bash
   # Copy dan edit file .env
   cp .env.example .env
   ```
   
   Edit `.env` dengan konfigurasi Anda (lihat [Environment Variables](#-environment-variables))

5. **Run development server**
   ```bash
   npm start
   ```

   Server akan berjalan di `http://localhost:5000`

---

## 📁 Struktur Project

```
tpdbKos/
├── src/
│   ├── config/
│   │   └── auth.js              # JWT secret configuration
│   ├── handlers/
│   │   ├── auth.handler.js      # Authentication & user management
│   │   ├── capacity.handler.js  # Effective capacity
│   │   ├── constraint.handler.js# Production constraints
│   │   ├── equipment.handler.js # Equipment inventory
│   │   ├── mine.handler.js      # Mine master data
│   │   ├── production.handler.js# Production planning
│   │   ├── road.handler.js      # Road conditions
│   │   ├── shipping.handler.js  # Shipping schedules
│   │   ├── user.handler.js      # User profile management
│   │   └── weather.handler.js   # Weather data
│   ├── helpers/
│   │   ├── email.helper.js      # Email utilities
│   │   └── pagination.helper.js # Pagination utilities
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT verification & authorization
│   ├── templates/
│   │   └── emails/
│   │       └── reset-password.mjml # Email template
│   ├── data.js                  # Database connection
│   ├── routes.js                # API routes definition
│   └── server.js                # Server entry point
├── tests/
│   ├── helpers/
│   │   └── test-helpers.js      # Test utilities
│   ├── equipment.test.js        # Equipment tests
│   ├── mine.test.js             # Mine tests
│   ├── operations.test.js       # Production, weather, roads, shipping tests
│   ├── user.test.js             # User & auth tests
│   ├── setup.js                 # Jest setup
│   └── README.md                # Testing documentation
├── .env                         # Environment variables (not in git)
├── jest.config.js               # Jest configuration
├── eslint.config.mjs            # ESLint configuration
├── package.json                 # Dependencies & scripts
├── miningv.sql                  # Database schema
├── TESTING.md                   # Quick testing guide
└── README.md                    # This file
```

---

## 🔧 Environment Variables

Buat file `.env` di root project dengan konfigurasi berikut:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=miningv

# JWT Secret
SECRET_KEY=your-super-secret-jwt-key

# Application
BASE_URL=http://localhost:5000
NODE_ENV=development

# Email Configuration (untuk password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**⚠️ PENTING:**
- Jangan commit file `.env` ke repository
- Gunakan strong secret key untuk production
- Untuk Gmail, gunakan [App Password](https://support.google.com/accounts/answer/185833)

---

## 🏃 Menjalankan Aplikasi

### Development Mode
```bash
npm start
```
Server akan berjalan dengan auto-reload menggunakan nodemon.

### Production Mode
```bash
node src/server.js
```

### Linting
```bash
npm run lint
```

---

## 🧪 Testing

Project ini dilengkapi dengan comprehensive test suite menggunakan Jest.

### Menjalankan Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test tests/user.test.js
```

### Test Coverage

- **User Management**: 23 tests (authentication, profile, password reset)
- **Equipment Management**: 8 tests (CRUD operations)
- **Mine Management**: 3 tests (GET operations)
- **Operations**: 16 tests (production, weather, roads, shipping)

**Total: 50+ test cases**

Untuk informasi lebih detail tentang testing, lihat [TESTING.md](TESTING.md) atau [tests/README.md](tests/README.md).

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication Header
Sebagian besar endpoint memerlukan JWT token:
```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| **admin** | Full access, manage users, update roles |
| **user** | Basic access, own profile management |
| **Mine Planner** | Manage equipment, capacity, production, constraints |
| **Shipping Planner** | Manage shipping schedules |

---

## 🔐 Authentication & Authorization

### Alur Authentication

1. **Register** → `POST /register`
2. **Login** → `POST /login` (dapatkan JWT token)
3. **Gunakan Token** → Sertakan di header setiap request
4. **Logout** → `DELETE /logout/{id}`

### Middleware

- `verifyToken`: Validasi JWT token
- `verifyAdmin`: Validasi role admin
- `verifyMinePlanner`: Validasi role mine planner
- `verifyShippingPlanner`: Validasi role shipping planner
- `verifyIsUser`: Validasi ownership atau admin

---

## 📖 API Endpoints

### User Management

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

### Mine Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/mines` | Get all mines (paginated) | Required |
| GET | `/mines/{id}` | Get mine by ID | Required |

### Equipment Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/equipments` | Get all equipments (paginated) | Mine Planner |
| GET | `/equipments/{id}` | Get equipment by ID | Mine Planner |
| POST | `/equipments` | Create new equipment | Mine Planner |
| PUT | `/equipments/{id}` | Update equipment | Mine Planner |

### Effective Capacity

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/effective-capacity` | Get all capacity data | Mine Planner |
| POST | `/effective-capacity` | Create capacity data | Mine Planner |
| PUT | `/effective-capacity/{id}` | Update capacity data | Mine Planner |

### Production Constraints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/production-constraints` | Get all constraints | Mine Planner |
| POST | `/production-constraints` | Create constraint | Mine Planner |

### Production Plans

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/production-plans` | Get all plans (paginated) | Required |
| POST | `/production-plans` | Create production plan | Mine Planner |
| PUT | `/production-plans/{id}` | Update production plan | Mine Planner |

### Weather Data

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/weather` | Get weather data (paginated) | Required |

### Road Conditions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/roads` | Get all road conditions | Required |
| PUT | `/roads/{id}` | Update road condition | Mine Planner |

### Shipping Schedules

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/shipping-schedules` | Get all schedules (paginated) | Shipping Planner |
| GET | `/shipping-schedules/{id}` | Get schedule by ID | Shipping Planner |
| POST | `/shipping-schedules` | Create schedule | Shipping Planner |
| PUT | `/shipping-schedules/{id}` | Update schedule | Shipping Planner |

---

## 📄 Pagination

Kebanyakan GET endpoints mendukung pagination dengan cursor-based pagination:

### Query Parameters
```
?limit=20              # Jumlah items per page (default: 20)
?cursor=<cursor>       # Cursor untuk page berikutnya
?start=2025-01-01      # Filter tanggal mulai
?end=2025-12-31        # Filter tanggal akhir
?all=true              # Get semua data tanpa pagination
```

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
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Token tidak valid/expired |
| 403 | Forbidden - Tidak punya akses |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Server Error - Internal server error |

---

## 💡 Best Practices

### 1. Security
- Selalu gunakan HTTPS di production
- Gunakan strong password untuk database dan JWT secret
- Implementasikan rate limiting
- Validate semua user input
- Sanitize data sebelum menyimpan ke database

### 2. Performance
- Gunakan pagination untuk large datasets
- Implement caching untuk frequently accessed data
- Optimize database queries dengan indexes
- Monitor query performance

### 3. Error Handling
- Log semua errors dengan detail yang cukup
- Return user-friendly error messages
- Jangan expose sensitive information di error messages

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use meaningful commit messages

---

## 📝 License

This project is licensed under the ISC License.

---

## 👥 Authors

- Backend Development Team

---

## 🆘 Support

Untuk pertanyaan atau issue, silakan buat issue di repository atau hubungi tim development.

---

## 📚 Additional Documentation

- **[TESTING.md](TESTING.md)** - Quick testing guide
- **[tests/README.md](tests/README.md)** - Comprehensive testing documentation
- **[API_DETAILED.md](API_DETAILED.md)** - Detailed API documentation (original README content)

---

**Happy Coding! 🚀**# Mining Management System API

> **Backend API untuk Sistem Manajemen Pertambangan Batubara**

Sistem ini menyediakan RESTful API untuk mengelola operasi tambang batubara, termasuk manajemen user, equipment, production planning, weather monitoring, road condition, dan shipping schedules.

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Instalasi & Setup](#-instalasi--setup)
- [Struktur Project](#-struktur-project)
- [Environment Variables](#-environment-variables)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Authentication & Authorization](#-authentication--authorization)
- [Contributing](#-contributing)

---

## 🚀 Fitur Utama

### User Management
- ✅ Registrasi & Login dengan JWT
- ✅ Role-based access control (Admin, Mine Planner, Shipping Planner)
- ✅ Password reset dengan email verification
- ✅ Profile management

### Mine Operations
- ✅ Mine master data management
- ✅ Equipment inventory tracking
- ✅ Effective capacity calculation
- ✅ Production planning & constraints
- ✅ Weather data monitoring
- ✅ Road condition tracking
- ✅ Shipping schedule management

### Features
- 📄 Comprehensive pagination support
- 🔐 JWT-based authentication
- 📧 Email notifications (password reset)
- 🧪 Complete test coverage
- 📊 RESTful API design

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Hapi.js v21
- **Database**: MySQL2
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer + MJML templates
- **Testing**: Jest
- **Linting**: ESLint (Dicoding Academy config)
- **Dev Tools**: Nodemon

---

## 📦 Instalasi & Setup

### Prerequisites

- Node.js (v14 atau lebih baru)
- MySQL (v5.7 atau lebih baru)
- npm atau yarn

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd tpdbKos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   # Import database schema
   mysql -u root -p < miningv.sql
   ```

4. **Configure environment**
   ```bash
   # Copy dan edit file .env
   cp .env.example .env
   ```
   
   Edit `.env` dengan konfigurasi Anda (lihat [Environment Variables](#-environment-variables))

5. **Run development server**
   ```bash
   npm start
   ```

   Server akan berjalan di `http://localhost:5000`

---

## 📁 Struktur Project

```
tpdbKos/
├── src/
│   ├── config/
│   │   └── auth.js              # JWT secret configuration
│   ├── handlers/
│   │   ├── auth.handler.js      # Authentication & user management
│   │   ├── capacity.handler.js  # Effective capacity
│   │   ├── constraint.handler.js# Production constraints
│   │   ├── equipment.handler.js # Equipment inventory
│   │   ├── mine.handler.js      # Mine master data
│   │   ├── production.handler.js# Production planning
│   │   ├── road.handler.js      # Road conditions
│   │   ├── shipping.handler.js  # Shipping schedules
│   │   ├── user.handler.js      # User profile management
│   │   └── weather.handler.js   # Weather data
│   ├── helpers/
│   │   ├── email.helper.js      # Email utilities
│   │   └── pagination.helper.js # Pagination utilities
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT verification & authorization
│   ├── templates/
│   │   └── emails/
│   │       └── reset-password.mjml # Email template
│   ├── data.js                  # Database connection
│   ├── routes.js                # API routes definition
│   └── server.js                # Server entry point
├── tests/
│   ├── helpers/
│   │   └── test-helpers.js      # Test utilities
│   ├── equipment.test.js        # Equipment tests
│   ├── mine.test.js             # Mine tests
│   ├── operations.test.js       # Production, weather, roads, shipping tests
│   ├── user.test.js             # User & auth tests
│   ├── setup.js                 # Jest setup
│   └── README.md                # Testing documentation
├── .env                         # Environment variables (not in git)
├── jest.config.js               # Jest configuration
├── eslint.config.mjs            # ESLint configuration
├── package.json                 # Dependencies & scripts
├── miningv.sql                  # Database schema
├── TESTING.md                   # Quick testing guide
└── README.md                    # This file
```

---

## 🔧 Environment Variables

Buat file `.env` di root project dengan konfigurasi berikut:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=miningv

# JWT Secret
SECRET_KEY=your-super-secret-jwt-key

# Application
BASE_URL=http://localhost:5000
NODE_ENV=development

# Email Configuration (untuk password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**⚠️ PENTING:**
- Jangan commit file `.env` ke repository
- Gunakan strong secret key untuk production
- Untuk Gmail, gunakan [App Password](https://support.google.com/accounts/answer/185833)

---

## 🏃 Menjalankan Aplikasi

### Development Mode
```bash
npm start
```
Server akan berjalan dengan auto-reload menggunakan nodemon.

### Production Mode
```bash
node src/server.js
```

### Linting
```bash
npm run lint
```

---

## 🧪 Testing

Project ini dilengkapi dengan comprehensive test suite menggunakan Jest.

### Menjalankan Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test tests/user.test.js
```

### Test Coverage

- **User Management**: 23 tests (authentication, profile, password reset)
- **Equipment Management**: 8 tests (CRUD operations)
- **Mine Management**: 3 tests (GET operations)
- **Operations**: 16 tests (production, weather, roads, shipping)

**Total: 50+ test cases**

Untuk informasi lebih detail tentang testing, lihat [TESTING.md](TESTING.md) atau [tests/README.md](tests/README.md).

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication Header
Sebagian besar endpoint memerlukan JWT token:
```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| **admin** | Full access, manage users, update roles |
| **user** | Basic access, own profile management |
| **Mine Planner** | Manage equipment, capacity, production, constraints |
| **Shipping Planner** | Manage shipping schedules |

---

## 🔐 Authentication & Authorization

### Alur Authentication

1. **Register** → `POST /register`
2. **Login** → `POST /login` (dapatkan JWT token)
3. **Gunakan Token** → Sertakan di header setiap request
4. **Logout** → `DELETE /logout/{id}`

### Middleware

- `verifyToken`: Validasi JWT token
- `verifyAdmin`: Validasi role admin
- `verifyMinePlanner`: Validasi role mine planner
- `verifyShippingPlanner`: Validasi role shipping planner
- `verifyIsUser`: Validasi ownership atau admin

---

## 📖 API Endpoints

### User Management

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

### Mine Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/mines` | Get all mines (paginated) | Required |
| GET | `/mines/{id}` | Get mine by ID | Required |

### Equipment Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/equipments` | Get all equipments (paginated) | Mine Planner |
| GET | `/equipments/{id}` | Get equipment by ID | Mine Planner |
| POST | `/equipments` | Create new equipment | Mine Planner |
| PUT | `/equipments/{id}` | Update equipment | Mine Planner |

### Effective Capacity

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/effective-capacity` | Get all capacity data | Mine Planner |
| POST | `/effective-capacity` | Create capacity data | Mine Planner |
| PUT | `/effective-capacity/{id}` | Update capacity data | Mine Planner |

### Production Constraints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/production-constraints` | Get all constraints | Mine Planner |
| POST | `/production-constraints` | Create constraint | Mine Planner |

### Production Plans

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/production-plans` | Get all plans (paginated) | Required |
| POST | `/production-plans` | Create production plan | Mine Planner |
| PUT | `/production-plans/{id}` | Update production plan | Mine Planner |

### Weather Data

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/weather` | Get weather data (paginated) | Required |

### Road Conditions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/roads` | Get all road conditions | Required |
| PUT | `/roads/{id}` | Update road condition | Mine Planner |

### Shipping Schedules

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/shipping-schedules` | Get all schedules (paginated) | Shipping Planner |
| GET | `/shipping-schedules/{id}` | Get schedule by ID | Shipping Planner |
| POST | `/shipping-schedules` | Create schedule | Shipping Planner |
| PUT | `/shipping-schedules/{id}` | Update schedule | Shipping Planner |

---

## 📄 Pagination

Kebanyakan GET endpoints mendukung pagination dengan cursor-based pagination:

### Query Parameters
```
?limit=20              # Jumlah items per page (default: 20)
?cursor=<cursor>       # Cursor untuk page berikutnya
?start=2025-01-01      # Filter tanggal mulai
?end=2025-12-31        # Filter tanggal akhir
?all=true              # Get semua data tanpa pagination
```

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
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Token tidak valid/expired |
| 403 | Forbidden - Tidak punya akses |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Server Error - Internal server error |

---

## 💡 Best Practices

### 1. Security
- Selalu gunakan HTTPS di production
- Gunakan strong password untuk database dan JWT secret
- Implementasikan rate limiting
- Validate semua user input
- Sanitize data sebelum menyimpan ke database

### 2. Performance
- Gunakan pagination untuk large datasets
- Implement caching untuk frequently accessed data
- Optimize database queries dengan indexes
- Monitor query performance

### 3. Error Handling
- Log semua errors dengan detail yang cukup
- Return user-friendly error messages
- Jangan expose sensitive information di error messages

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use meaningful commit messages

---

## 📝 License

This project is licensed under the ISC License.

---

## 👥 Authors

- Backend Development Team

---

## 🆘 Support

Untuk pertanyaan atau issue, silakan buat issue di repository atau hubungi tim development.

---

## 📚 Additional Documentation

- **[TESTING.md](TESTING.md)** - Quick testing guide
- **[tests/README.md](tests/README.md)** - Comprehensive testing documentation
- **[API_DETAILED.md](API_DETAILED.md)** - Detailed API documentation (original README content)
