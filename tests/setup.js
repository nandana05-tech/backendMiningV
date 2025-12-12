// Jest setup file
// This file runs before each test suite

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.SECRET_KEY = 'test-secret-key-for-jwt';
process.env.BASE_URL = 'http://localhost:5000';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASSWORD = 'test-password';

// Suppress console logs during tests (optional, comment out if you need to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
// };
