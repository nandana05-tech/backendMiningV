/**
 * Production Plans, Weather, Roads, and Shipping Tests
 * Tests for various operations endpoints
 */

jest.mock('../src/data');
jest.mock('../src/middleware/auth.middleware');
jest.mock('../src/helpers/pagination.helper');

const pool = require('../src/data');
const { verifyToken, verifyMinePlanner, verifyShippingPlanner } = require('../src/middleware/auth.middleware');
const { fetchPaginatedData, fetchPaginatedComposite } = require('../src/helpers/pagination.helper');
const { createMockRequest, createMockResponseToolkit } = require('./helpers/test-helpers');

// Import handlers
const {
  getProductionPlans,
  createProductionPlan,
  updateProductionPlan
} = require('../src/handlers/production.handler');

const { getWeatherData } = require('../src/handlers/weather.handler');

const {
  getRoadConditions,
  updateRoadCondition
} = require('../src/handlers/road.handler');

const {
  getAllShippingSchedules,
  getShippingScheduleById,
  createShippingSchedule,
  updateShippingSchedule
} = require('../src/handlers/shipping.handler');

describe('Production Plans Management', () => {
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    const toolkit = createMockResponseToolkit();
    mockH = toolkit.h;
    mockResponse = toolkit.response;
  });

  describe('GET /production-plans - Get Production Plans', () => {
    test('should successfully get all production plans', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        query: { limit: 10 }
      });

      const mockPlans = [
        { plan_id: 'PLAN001', mine_id: 'M001', week_start: '2025-11-27', status: 'active' },
        { plan_id: 'PLAN002', mine_id: 'M002', week_start: '2025-11-28', status: 'pending' }
      ];

      fetchPaginatedData.mockResolvedValue({
        rows: mockPlans,
        nextCursor: null,
        total: 2
      });

      const result = await getProductionPlans(mockRequest, mockH);

      expect(fetchPaginatedData).toHaveBeenCalledWith(expect.objectContaining({
        table: 'production_plan',
        limit: 10
      }));
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockPlans
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });

  describe('POST /production-plans - Create Production Plan', () => {
    test('should successfully create production plan', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false, isBoom: false });
      
      mockRequest = createMockRequest({
        payload: {
          mine_id: 'M001',
          week_start: '2025-11-27',
          planned_output_ton: 5000,
          actual_output_ton: 0,
          target_variance_pct: 0,
          status: 'active',
          updated_by: 'user1'
        }
      });

      pool.query
        .mockResolvedValueOnce([[{ plan_id: 'PLAN001' }]]) // Get last ID
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert

      const result = await createProductionPlan(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(201);
    });
  });

  describe('PUT /production-plans/{id} - Update Production Plan', () => {
    test('should successfully update production plan', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false, isBoom: false });
      
      mockRequest = createMockRequest({
        params: { id: 'PLAN001' },
        payload: {
          mine_id: 'M001',
          week_start: '2025-11-27',
          planned_output_ton: 6000,
          actual_output_ton: 5500,
          target_variance_pct: 8.3,
          status: 'completed',
          updated_by: 'user1'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await updateProductionPlan(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });
});

describe('Weather Data', () => {
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    const toolkit = createMockResponseToolkit();
    mockH = toolkit.h;
    mockResponse = toolkit.response;
  });

  describe('GET /weather - Get Weather Data', () => {
    test('should successfully get weather data', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        query: { limit: 10 }
      });

      const mockWeather = [
        { weather_id: 'W001', mine_id: 'M001', date: '2025-11-27', rainfall_mm: 50 }
      ];

      fetchPaginatedComposite.mockResolvedValue({
        data: mockWeather,
        nextCursor: null,
        total: 1
      });

      const result = await getWeatherData(mockRequest, mockH);

      expect(fetchPaginatedComposite).toHaveBeenCalled();
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });
});

describe('Road Conditions', () => {
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    const toolkit = createMockResponseToolkit();
    mockH = toolkit.h;
    mockResponse = toolkit.response;
  });

  describe('GET /roads - Get Road Conditions', () => {
    test('should successfully get road conditions', async () => {
      verifyToken.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        query: { limit: 10 }
      });

      const mockRoads = [
        { road_id: 'R001', segment_name: 'Road A', condition_level: 'Good' },
        { road_id: 'R002', segment_name: 'Road B', condition_level: 'Fair' }
      ];

      fetchPaginatedData.mockResolvedValue({
        rows: mockRoads,
        nextCursor: null,
        total: 2
      });

      const result = await getRoadConditions(mockRequest, mockH);

      expect(fetchPaginatedData).toHaveBeenCalledWith(expect.objectContaining({
        table: 'road_condition',
        limit: 10
      }));
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockRoads
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });

  describe('PUT /roads/{id} - Update Road Condition', () => {
    test('should successfully update road condition', async () => {
      verifyMinePlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'R001' },
        payload: {
          mine_id: 'M001',
          segment_name: 'Road A',
          condition_level: 'Fair',
          accessibility_pct: 85,
          last_inspection: '2025-11-27',
          remark: 'Some repairs needed'
        }
      });

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await updateRoadCondition(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });
});

describe('Shipping Schedules', () => {
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    const toolkit = createMockResponseToolkit();
    mockH = toolkit.h;
    mockResponse = toolkit.response;
  });

  describe('GET /shipping-schedules - Get All Shipping Schedules', () => {
    test('should successfully get all shipping schedules', async () => {
      verifyShippingPlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        query: { limit: 10 }
      });

      const mockSchedules = [
        { shipment_id: 'SHP001', mine_id: 'M001', destination_port: 'Port A', status: 'scheduled' },
        { shipment_id: 'SHP002', mine_id: 'M002', destination_port: 'Port B', status: 'completed' }
      ];

      fetchPaginatedData.mockResolvedValue({
        rows: mockSchedules,
        nextCursor: null,
        total: 2
      });

      const result = await getAllShippingSchedules(mockRequest, mockH);

      expect(fetchPaginatedData).toHaveBeenCalledWith(expect.objectContaining({
        table: 'shipping_schedule',
        limit: 10
      }));
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockSchedules
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });

  describe('GET /shipping-schedules/{id} - Get Shipping Schedule By ID', () => {
    test('should successfully get shipping schedule by ID', async () => {
      verifyShippingPlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'SHP001' }
      });

      const mockSchedule = { 
        shipment_id: 'SHP001', 
        mine_id: 'M001', 
        destination_port: 'Port A', 
        status: 'scheduled' 
      };
      
      pool.query.mockResolvedValue([[mockSchedule]]);

      const result = await getShippingScheduleById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false,
          data: mockSchedule
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    test('should return 404 if shipping schedule not found', async () => {
      verifyShippingPlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'SHP999' }
      });

      pool.query.mockResolvedValue([[]]);

      const result = await getShippingScheduleById(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /shipping-schedules - Create Shipping Schedule', () => {
    test('should successfully create shipping schedule', async () => {
      verifyShippingPlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        payload: {
          mine_id: 'M001',
          week_start: '2025-11-27',
          vessel_name: 'Vessel A',
          destination_port: 'Port A',
          coal_tonnage: 5000,
          etd: '2025-11-28',
          eta: '2025-12-01',
          status: 'scheduled'
        }
      });

      pool.query
        .mockResolvedValueOnce([[{ shipment_id: 'SHP001' }]]) // Get last ID
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert

      const result = await createShippingSchedule(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(201);
    });
  });

  describe('PUT /shipping-schedules/{id} - Update Shipping Schedule', () => {
    test('should successfully update shipping schedule', async () => {
      verifyShippingPlanner.mockResolvedValue({ error: false });
      
      mockRequest = createMockRequest({
        params: { id: 'SHP001' },
        payload: {
          mine_id: 'M001',
          week_start: '2025-11-27',
          vessel_name: 'Updated Vessel',
          destination_port: 'Port C',
          coal_tonnage: 6000,
          etd: '2025-11-28',
          eta: '2025-12-01',
          status: 'completed'
        }
      });

      pool.execute = jest.fn().mockResolvedValue([{ affectedRows: 1 }]);

      const result = await updateShippingSchedule(mockRequest, mockH);

      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: false
        })
      );
      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });
  });
});
