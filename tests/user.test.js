/**
 * User Management Tests
 * Tests for authentication and user CRUD operations
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock dependencies before requiring handlers
jest.mock('../src/data');
jest.mock('../src/middleware/auth.middleware');
jest.mock('../src/helpers/email.helper');

const pool = require('../src/data');
const { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getUserById, 
  updateUser, 
  deleteUser, 
  forgotPassword, 
  resetPassword,
  updateRoleUser
} = require('../src/handlers/auth.handler');

const { verifyToken, verifyAdmin, verifyIsUser } = require('../src/middleware/auth.middleware');
const { sendEmail } = require('../src/helpers/email.helper');
const { createMockRequest, createMockResponseToolkit, fixtures } = require('./helpers/test-helpers');

describe('User Management - Authentication', () => {
  let mockPool;
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock response toolkit
    const toolkit = createMockResponseToolkit();
    mockH = toolkit.h;
    mockResponse = toolkit.response;
  });

  describe('POST /register - Register User', () => {
    test('should successfully register a new user', async () => {
      mockRequest = createMockRequest({
        payload: {
          nama: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'user'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await registerUser(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
        expect.arrayContaining(['New User', 'newuser@example.com', expect.any(String), 'user'])
      );
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Registrasi berhasil',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(201);
    });

    test('should handle registration errors', async () => {
      mockRequest = createMockRequest({
        payload: {
          nama: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        }
      });

      pool.query.mockRejectedValue(new Error('Database error'));

      const result = await registerUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Gagal registrasi',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(500);
    });
  });

  describe('POST /login - Login User', () => {
    test('should successfully login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      mockRequest = createMockRequest({
        payload: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      pool.query.mockResolvedValueOnce([
        [{ id: 1, nama: 'Test User', email: 'test@example.com', password: hashedPassword, role: 'user' }]
      ]).mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await loginUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login berhasil',
          error: false,
          data: expect.objectContaining({
            token: expect.any(String),
            id: 1,
            role: 'user',
            nama: 'Test User'
          })
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if email not found', async () => {
      mockRequest = createMockRequest({
        payload: {
          email: 'notfound@example.com',
          password: 'password123'
        }
      });

      pool.query.mockResolvedValue([[]]);

      const result = await loginUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Email tidak ditemukan',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });

    test('should return 401 if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      
      mockRequest = createMockRequest({
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });

      pool.query.mockResolvedValue([
        [{ id: 1, nama: 'Test User', email: 'test@example.com', password: hashedPassword, role: 'user' }]
      ]);

      const result = await loginUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Password salah',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(401);
    });
  });

  describe('DELETE /logout/{id} - Logout User', () => {
    test('should successfully logout user', async () => {
      mockRequest = createMockRequest({
        headers: {
          authorization: 'Bearer valid-token-123'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await logoutUser(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET token = NULL WHERE token = ?',
        ['valid-token-123']
      );
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Logout berhasil',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 400 if token not provided', async () => {
      mockRequest = createMockRequest({
        headers: {}
      });

      const result = await logoutUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Token tidak ditemukan',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(400);
    });
  });

  describe('GET /users/{id} - Get User By ID', () => {
    test('should successfully get user profile', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      pool.query.mockResolvedValue([
        [{ id: 1, nama: 'Test User', email: 'test@example.com', role: 'user' }]
      ]);

      const result = await getUserById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Profil berhasil diambil',
        error: false,
        data: { id: 1, nama: 'Test User', email: 'test@example.com', role: 'user' }
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if user not found', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '999' }
      });

      pool.query.mockResolvedValue([[]]);

      const result = await getUserById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Pengguna tidak ditemukan',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });

    test('should return error if unauthorized', async () => {
      verifyToken.mockResolvedValue({ 
        error: true, 
        message: 'Token tidak valid',
        status: 401
      });
      
      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      const result = await getUserById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Token tidak valid',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(401);
    });
  });

  describe('PUT /users/{id} - Update User', () => {
    test('should successfully update user without password', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '1' },
        payload: {
          nama: 'Updated Name',
          email: 'updated@example.com'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await updateUser(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET nama = ?, email = ?, updated_at = NOW() WHERE id = ?',
        ['Updated Name', 'updated@example.com', '1']
      );
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Profil berhasil diperbarui',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should successfully update user with password', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '1' },
        payload: {
          nama: 'Updated Name',
          email: 'updated@example.com',
          password: 'newpassword123'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await updateUser(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET nama = ?, email = ?, password = ?, updated_at = NOW() WHERE id = ?',
        expect.arrayContaining(['Updated Name', 'updated@example.com', expect.any(String), '1'])
      );
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Profil berhasil diperbarui',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if user not found', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '999' },
        payload: {
          nama: 'Updated Name',
          email: 'updated@example.com'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await updateUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Pengguna tidak ditemukan',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });
  });

  describe('PUT /users/{id}/role - Update User Role', () => {
    test('should successfully update user role (admin only)', async () => {
      verifyAdmin.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '1' },
        payload: { role: 'admin' }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await updateRoleUser(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET role = ? WHERE id = ?',
        ['admin', '1']
      );
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Role pengguna berhasil diperbarui',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 400 if role is empty', async () => {
      verifyAdmin.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '1' },
        payload: { role: '' }
      });

      const result = await updateRoleUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Field role tidak boleh kosong'
      });
      expect(mockResponse.code).toHaveBeenCalledWith(400);
    });
  });

  describe('DELETE /users/{id} - Delete User', () => {
    test('should successfully delete user', async () => {
      verifyIsUser.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await deleteUser(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        ['1']
      );
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Profil berhasil dihapus',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if user not found', async () => {
      verifyIsUser.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: '999' }
      });

      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await deleteUser(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Pengguna tidak ditemukan',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /forgot-password - Forgot Password', () => {
    test('should successfully send password reset email', async () => {
      mockRequest = createMockRequest({
        payload: { email: 'test@example.com' }
      });

      pool.query
        .mockResolvedValueOnce([[{ id: 1 }]])  // Check user exists
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // Delete old tokens
        .mockResolvedValueOnce([{ affectedRows: 1 }]);  // Insert new token

      sendEmail.mockResolvedValue(true);

      const result = await forgotPassword(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE email = ?',
        ['test@example.com']
      );
      expect(sendEmail).toHaveBeenCalled();
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Email reset password telah dikirim',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if email not registered', async () => {
      mockRequest = createMockRequest({
        payload: { email: 'notfound@example.com' }
      });

      pool.query.mockResolvedValue([[]]);

      const result = await forgotPassword(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Email tidak terdaftar',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /reset-password - Reset Password', () => {
    test('should successfully reset password with valid token', async () => {
      mockRequest = createMockRequest({
        payload: {
          token: 'valid-reset-token',
          newPassword: 'newpassword123'
        }
      });

      pool.query
        .mockResolvedValueOnce([[{ id: 1, user_id: 1 }]])  // Check token
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // Update password
        .mockResolvedValueOnce([{ affectedRows: 1 }]);  // Delete token

      const result = await resetPassword(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Password berhasil direset',
        error: false
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 400 if token invalid or expired', async () => {
      mockRequest = createMockRequest({
        payload: {
          token: 'invalid-token',
          newPassword: 'newpassword123'
        }
      });

      pool.query.mockResolvedValue([[]]);

      const result = await resetPassword(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Token tidak valid atau kadaluarsa',
        error: true
      });
      expect(mockResponse.code).toHaveBeenCalledWith(400);
    });
  });
});
