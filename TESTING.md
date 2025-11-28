# Panduan Singkat: Menjalankan Test

## Langkah 1: Install Dependencies
```bash
npm install
```

## Langkah 2: Jalankan Test
```bash
# Semua test
npm test

# Dengan coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Yang Sudah Dibuat

### File Konfigurasi
- ✅ `jest.config.js` - Konfigurasi Jest
- ✅ `tests/setup.js` - Setup environment

### Test Files
- ✅ `tests/user.test.js` - 24 test cases (auth & user management)
- ✅ `tests/equipment.test.js` - 8 test cases
- ✅ `tests/mine.test.js` - 3 test cases  
- ✅ `tests/operations.test.js` - 16 test cases (production, weather, roads, shipping)

### Total: 51+ test cases untuk 24 endpoints

## Test Coverage

Semua endpoint di `routes.js` sudah tercakup:
- User Management (8 endpoints)
- Equipment (4 endpoints)
- Mine (2 endpoints)
- Production Plans (3 endpoints)
- Weather (1 endpoint)
- Road Conditions (2 endpoints)
- Shipping Schedules (4 endpoints)

## Dokumentasi Lengkap

Lihat `tests/README.md` untuk dokumentasi lengkap.
