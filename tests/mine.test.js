/**
 * Mine Management Tests
 * Tests for mine endpoints
 */

jest.mock('../src/data');
jest.mock('../src/middleware/auth.middleware');
jest.mock('../src/helpers/pagination.helper');

const pool = require('../src/data');
const { getAllMines, getMineById } = require('../src/handlers/mine.handler');
const { verifyToken } = require('../src/middleware/auth.middleware');
const { fetchPaginatedData } = require('../src/helpers/pagination.helper');
const { createMockRequest, createMockResponseToolkit } = require('./helpers/test-helpers');

describe('Mine Management', () => {
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    const toolkit = createMockResponseToolkit();
    mockH = toolkit.h;
    mockResponse = toolkit.response;
  });

  describe('GET /mines - Get All Mines', () => {
    test('should successfully get all mines', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        query: { limit: 10 }
      });

      const mockMines = [
        { mine_id: 'M001', mine_name: 'Mine A', location: 'Location A' },
        { mine_id: 'M002', mine_name: 'Mine B', location: 'Location B' }
      ];

      fetchPaginatedData.mockResolvedValue({
        rows: mockMines,
        nextCursor: null,
        total: 2
      });

      const result = await getAllMines(mockRequest, mockH);

      expect(fetchPaginatedData).toHaveBeenCalledWith(expect.objectContaining({
        table: 'mine_master',
        limit: 10
      }));
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockMines,
          total: 2
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });

  describe('GET /mines/{id} - Get Mine By ID', () => {
    test('should successfully get mine by ID', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'M001' }
      });

      const mockMine = { mine_id: 'M001', mine_name: 'Mine A', location: 'Location A' };
      pool.query.mockResolvedValue([[mockMine]]);

      const result = await getMineById(mockRequest, mockH);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['M001']
      );
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockMine
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if mine not found', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'M999' }
      });

      pool.query.mockResolvedValue([[]]);

      const result = await getMineById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });
  });
});
