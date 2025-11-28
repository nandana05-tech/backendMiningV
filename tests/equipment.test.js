  /**
 * Equipment Management Tests
 * Tests for equipment CRUD operations
 */

jest.mock('../src/data');
jest.mock('../src/middleware/auth.middleware');
jest.mock('../src/helpers/pagination.helper');

const pool = require('../src/data');
const {
  getAllEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment
} = require('../src/handlers/equipment.handler');
const { verifyMinePlanner } = require('../src/middleware/auth.middleware');
const { fetchPaginatedData } = require('../src/helpers/pagination.helper');
const { createMockRequest, createMockResponseToolkit } = require('./helpers/test-helpers');

describe('Equipment Management', () => {
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    const toolkit = createMockResponseToolkit();
    mockH = toolkit.h;
    mockResponse = toolkit.response;
  });

  describe('GET /equipments - Get All Equipments', () => {
    test('should successfully get all equipments with pagination', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        query: { limit: 10 }
      });

      const mockEquipments = [
        { equipment_id: 'EQ001', equipment_type: 'Excavator', brand: 'Caterpillar' },
        { equipment_id: 'EQ002', equipment_type: 'Dump Truck', brand: 'Komatsu' }
      ];

      fetchPaginatedData.mockResolvedValue({
        rows: mockEquipments,
        nextCursor: null,
        total: 2
      });

      const result = await getAllEquipments(mockRequest, mockH);

      expect(fetchPaginatedData).toHaveBeenCalledWith(expect.objectContaining({
        table: 'equipment_inventory',
        limit: 10
      }));
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockEquipments,
          total: 2
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return empty array if no equipments found', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        query: { limit: 10 }
      });

      fetchPaginatedData.mockResolvedValue({
        rows: [],
        nextCursor: null,
        total: 0
      });

      const result = await getAllEquipments(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: []
        })
      );
    });
  });

  describe('GET /equipments/{id} - Get Equipment By ID', () => {
    test('should successfully get equipment by ID', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'EQ001' }
      });

      const mockEquipment = { equipment_id: 'EQ001', equipment_type: 'Excavator', brand: 'Caterpillar' };
      pool.query.mockResolvedValue([[mockEquipment]]);

      const result = await getEquipmentById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockEquipment
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if equipment not found', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'EQ999' }
      });

      pool.query.mockResolvedValue([[]]);

      const result = await getEquipmentById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /equipments - Create Equipment', () => {
    test('should successfully create new equipment', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        payload: {
          mine_id: 'M001',
          equipment_type: 'Excavator',
          brand: 'Caterpillar',
          model: 'CAT320',
          base_capacity_ton: 100,
          last_maintenance: '2025-11-01',
          operator_id: 'OP001'
        }
      });

      // Mock connection for transaction
      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        query: jest.fn()
          .mockResolvedValueOnce([[{ newId: 'EQ003' }]]) // Get new ID
          .mockResolvedValueOnce([{ affectedRows: 1 }]), // Insert
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };

      pool.getConnection = jest.fn().mockResolvedValue(mockConnection);

      const result = await createEquipment(mockRequest, mockH);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: { equipment_id: 'EQ003' }
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(201);
    });
  });

  describe('PUT /equipments/{id} - Update Equipment', () => {
    test('should successfully update equipment', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'EQ001' },
        payload: {
          mine_id: 'M001',
          equipment_type: 'Excavator',
          brand: 'Updated Brand',
          model: 'Updated Model',
          base_capacity_ton: 120,
          last_maintenance: '2025-11-27',
          operator_id: 'OP001'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await updateEquipment(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if equipment not found', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'EQ999' },
        payload: {
          mine_id: 'M001',
          equipment_type: 'Excavator',
          brand: 'Updated Brand',
          model: 'Updated Model',
          base_capacity_ton: 120,
          last_maintenance: '2025-11-27',
          operator_id: 'OP001'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await updateEquipment(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });
  });
});
