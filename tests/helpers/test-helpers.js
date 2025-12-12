/**
 * Test Helper Utilities
 * Provides mock objects and helper functions for testing
 */

/**
 * Creates a mock Hapi request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request object
 */
const createMockRequest = (options = {}) => {
  return {
    params: options.params || {},
    payload: options.payload || {},
    query: options.query || {},
    headers: options.headers || {},
    auth: options.auth || {},
    ...options
  };
};

/**
 * Creates a mock Hapi response toolkit (h)
 * @returns {Object} Mock response toolkit
 */
const createMockResponseToolkit = () => {
  const response = {
    code: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    _data: null,
    _code: null
  };

  const h = {
    response: jest.fn((data) => {
      response._data = data;
      return response;
    }),
    continue: Symbol('continue'),
    authenticated: jest.fn(),
    unauthenticated: jest.fn(),
    redirect: jest.fn()
  };

  return { h, response };
};

/**
 * Mock database pool with query method
 * @returns {Object} Mock pool
 */
const createMockPool = () => {
  return {
    query: jest.fn()
  };
};

/**
 * Test data fixtures
 */
const fixtures = {
  user: {
    id: 1,
    nama: 'Test User',
    email: 'test@example.com',
    password: 'hashed_password_123',
    role: 'user',
    token: 'test-jwt-token-123',
    created_at: new Date(),
    updated_at: new Date()
  },
  admin: {
    id: 2,
    nama: 'Admin User',
    email: 'admin@example.com',
    password: 'hashed_admin_password',
    role: 'admin',
    token: 'admin-jwt-token-456'
  },
  mine: {
    id: 1,
    nama: 'Test Mine',
    lokasi: 'Test Location',
    kapasitas: 1000
  },
  equipment: {
    id: 1,
    nama: 'Excavator',
    jenis: 'Heavy Equipment',
    status: 'operasional',
    mine_id: 1
  },
  productionPlan: {
    id: 1,
    mine_id: 1,
    target_produksi: 5000,
    tanggal: '2025-11-27',
    status: 'aktif'
  }
};

/**
 * Helper to get auth header with token
 * @param {string} token - JWT token
 * @returns {Object} Headers object
 */
const getAuthHeader = (token = 'test-token') => {
  return {
    authorization: `Bearer ${token}`
  };
};

module.exports = {
  createMockRequest,
  createMockResponseToolkit,
  createMockPool,
  fixtures,
  getAuthHeader
};
