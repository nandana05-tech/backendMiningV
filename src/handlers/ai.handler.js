/**
 * AI Handler - AI Prediction Endpoints
 * Handles communication between Node.js backend and Python AI service
 */

const pool = require('../data');
const { 
  makeAIRequest, 
  checkAIServiceHealth, 
  formatWeatherData,
  formatPredictionError 
} = require('../helpers/ai.helper');

/**
 * Health check for AI service
 * GET /ai/health
 */
const checkAIHealth = async (request, h) => {
  try {
    const isHealthy = await checkAIServiceHealth();
    
    if (isHealthy) {
      return h.response({
        status: 'success',
        message: 'AI Service is healthy',
        service_url: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000',
      }).code(200);
    }
    
    return h.response({
      error: true,
      status: 503,
      message: 'AI Service is not responding',
      service_url: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000',
    }).code(503);
  } catch (error) {
    return h.response({
      error: true,
      status: 500,
      message: 'Failed to check AI service health',
      error: error.message,
    }).code(500);
  }
};

/**
 * Forecast weather for upcoming days
 * POST /ai/weather/forecast
 * Body: { mine_id: string, days_ahead?: number }
 */
const forecastWeather = async (request, h) => {
  try {
    const { mine_id, days_ahead = 7 } = request.payload;
    
    if (!mine_id) {
      return h.response({
        error: true,
        status: 400,
        message: 'mine_id is required',
      }).code(400);
    }
    
    // Get historical weather data from database (last 30 days)
    const [rows] = await pool.query(
      `SELECT date, mine_id, rainfall_mm, temperature_c, humidity_pct, wind_speed_kmh
       FROM weather_data
       WHERE mine_id = ?
       ORDER BY date DESC
       LIMIT 30`,
      [mine_id]
    );
    
    if (rows.length === 0) {
      return h.response({
        error: true,
        status: 404,
        message: 'No historical weather data found for this mine',
        hint: `No weather data exists for mine_id: ${mine_id}. Please check if the mine_id is correct or add weather data to the database.`,
      }).code(404);
    }
    
    // Format data for AI service
    const historicalData = formatWeatherData(rows.reverse()); // Reverse to chronological order
    
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
        details: {
          service_url: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000',
          instructions: [
            '1. Open a NEW terminal/command prompt',
            '2. Navigate to project: cd c:\\javascript-projects\\miningv',
            '3. Run: start_ai_service.bat',
            '4. Wait for message: "AI Service ready!" and "Uvicorn running on http://0.0.0.0:8000"',
            '5. Try this request again'
          ],
          alternative: 'You can also run manually: cd src/Modelling && python api_service.py',
          verify: 'Test if service is running: GET http://localhost:8000/health'
        },
        historical_data_count: rows.length,
      }).code(503);
    }
    
    // Call Python AI service
    const prediction = await makeAIRequest('/api/ai/weather/forecast', {
      mine_id,
      historical_data: historicalData,
      days_ahead: parseInt(days_ahead),
    });
    
    return h.response({
      error: false,
      status: 200,
      data: prediction,
    }).code(200);
  } catch (error) {
    console.error('Weather forecast error:', error);
    const errorResponse = formatPredictionError(error);
    return h.response(errorResponse).code(500);
  }
};

/**
 * Classify current weather condition
 * POST /ai/weather/classify
 * Body: { rainfall_mm, temperature_c, humidity_pct, wind_speed_kmh }
 */
const classifyWeather = async (request, h) => {
  try {
    const { rainfall_mm, temperature_c, humidity_pct, wind_speed_kmh } = request.payload;
    
    // Validate required fields
    if (rainfall_mm === undefined || temperature_c === undefined || 
        humidity_pct === undefined || wind_speed_kmh === undefined) {
      return h.response({
        error: true,
        status: 400,
        message: 'Missing required weather parameters',
      }).code(400);
    }
    
    // Call Python AI service
    const prediction = await makeAIRequest('/api/ai/weather/classify', {
      rainfall_mm: parseFloat(rainfall_mm),
      temperature_c: parseFloat(temperature_c),
      humidity_pct: parseFloat(humidity_pct),
      wind_speed_kmh: parseFloat(wind_speed_kmh),
    });
    
    return h.response({
      error: false,
      status: 200,
      data: prediction,
    }).code(200);
  } catch (error) {
    console.error('Weather classification error:', error);
    const errorResponse = formatPredictionError(error);
    return h.response(errorResponse).code(500);
  }
};

/**
 * Predict effective capacity
 * POST /ai/capacity/predict
 * Body: { mine_id, equipment_id, equipment_type, road_condition, weather_condition, availability_pct }
 */
const predictCapacity = async (request, h) => {
  try {
    const { 
      mine_id, 
      equipment_id, 
      equipment_type, 
      road_condition,
      weather_condition,
      availability_pct
    } = request.payload;
    
    // Validate required fields
    if (!mine_id || !equipment_id || !equipment_type || 
        !road_condition || !weather_condition || availability_pct === undefined) {
      return h.response({
        error: true,
        status: 400,
        message: 'Missing required fields for capacity prediction',
        required_fields: {
          mine_id: 'string',
          equipment_id: 'string',
          equipment_type: 'string',
          road_condition: 'string (Good/Fair)',
          weather_condition: 'string (Cerah/Berawan/Mendung/Hujan ringan/Hujan lebat)',
          availability_pct: 'number (0-100)'
        }
      }).code(400);
    }
    
    // Call Python AI service
    const prediction = await makeAIRequest('/api/ai/capacity/predict', {
      mine_id,
      equipment_id,
      equipment_type,
      road_condition,
      weather_condition,
      availability_pct: parseFloat(availability_pct)
    });
    
    return h.response({
      error: false,
      status: 200,
      data: prediction,
    }).code(200);
  } catch (error) {
    console.error('Capacity prediction error:', error);
    const errorResponse = formatPredictionError(error);
    return h.response(errorResponse).code(500);
  }
};

/**
 * Predict production output
 * POST /ai/production/predict
 * Body: { road_condition, weather_condition, availability_pct, effective_capacity_ton_day, planned_output_ton }
 */
const predictProduction = async (request, h) => {
  try {
    const {
      road_condition,
      weather_condition,
      availability_pct,
      effective_capacity_ton_day,
      planned_output_ton
    } = request.payload;
    
    // Validate required fields
    if (!road_condition || !weather_condition || availability_pct === undefined ||
        effective_capacity_ton_day === undefined || planned_output_ton === undefined) {
      return h.response({
        error: true,
        status: 400,
        message: 'Missing required fields for production prediction',
        required_fields: {
          road_condition: 'string (Good/Fair)',
          weather_condition: 'string (Cerah/Berawan/Mendung/Hujan ringan/Hujan lebat)',
          availability_pct: 'number (0-100)',
          effective_capacity_ton_day: 'number',
          planned_output_ton: 'number'
        }
      }).code(400);
    }
    
    // Call Python AI service
    const prediction = await makeAIRequest('/api/ai/production/predict', {
      road_condition,
      weather_condition,
      availability_pct: parseFloat(availability_pct),
      effective_capacity_ton_day: parseFloat(effective_capacity_ton_day),
      planned_output_ton: parseFloat(planned_output_ton)
    });
    
    return h.response({
      error: false,
      status: 200,
      data: prediction,
    }).code(200);
  } catch (error) {
    console.error('Production prediction error:', error);
    const errorResponse = formatPredictionError(error);
    return h.response(errorResponse).code(500);
  }
};

/**
 * Get AI-powered recommendations (Smart prediction flow)
 * POST /ai/recommendations
 * Body: { mine_id, date? }
 */
const getAIRecommendations = async (request, h) => {
  try {
    const { mine_id, date = new Date().toISOString().split('T')[0] } = request.payload;
    
    if (!mine_id) {
      return h.response({
        error: true,
        status: 400,
        message: 'mine_id is required',
      }).code(400);
    }
    
    const recommendations = {
      mine_id,
      date,
      predictions: {},
    };
    
    // 1. Forecast weather
    try {
      const [weatherRows] = await pool.query(
        `SELECT date, mine_id, rainfall_mm, temperature_c, humidity_pct, wind_speed_kmh
         FROM weather_data
         WHERE mine_id = ?
         ORDER BY date DESC
         LIMIT 30`,
        [mine_id]
      );
      
      if (weatherRows.length > 0) {
        const historicalData = formatWeatherData(weatherRows.reverse());
        const weatherForecast = await makeAIRequest('/api/ai/weather/forecast', {
          mine_id,
          historical_data: historicalData,
          days_ahead: 7,
        });
        recommendations.predictions.weather_forecast = weatherForecast;
      }
    } catch (error) {
      console.error('Weather forecast failed in recommendations:', error.message);
      recommendations.predictions.weather_forecast = { error: error.message };
    }
    
    // 2. Get equipment data and predict capacity
    try {
      const [equipmentRows] = await pool.query(
        `SELECT e.equipment_id, e.mine_id, e.equipment_type, e.brand, e.model, e.base_capacity_ton, e.last_maintenance, e.operator_id, m.mine_name, m.location, m.region, m.start_date, m.status, m.remarks 
         FROM equipment_inventory e
         JOIN mine_master m ON e.mine_id = m.mine_id
         WHERE e.mine_id = ?
         LIMIT 1`,
        [mine_id]
      );
      
      if (equipmentRows.length > 0) {
        const equipment = equipmentRows[0];
        const capacityPrediction = await makeAIRequest('/api/ai/capacity/predict', {
          mine_id,
          equipment_id: equipment.equipment_id,
          mine_type: equipment.mine_type,
          equipment_type: equipment.equipment_type,
          equipment_capacity_ton: parseFloat(equipment.base_capacity_ton),
          operational_hours_day: parseFloat(equipment.operational_hours_day),
        });
        recommendations.predictions.effective_capacity = capacityPrediction;
      }
    } catch (error) {
      console.error('Capacity prediction failed in recommendations:', error.message);
      recommendations.predictions.effective_capacity = { error: error.message };
    }
    
    return h.response({
      error: false,
      status: 200,
      data: recommendations,
    }).code(200);
  } catch (error) {
    console.error('AI recommendations error:', error);
    return h.response({
      error: true,
      status: 500,
      message: 'Failed to generate AI recommendations',
      error: error.message,
    }).code(500);
  }
};

// ============ LLM Handlers ============

/**
 * Get LLM-powered recommendations with user prompt
 * POST /ai/llm/recommend
 * Body: { user_prompt?, weather_data?, capacity_data?, production_data?, additional_context? }
 */
const getLLMRecommendations = async (request, h) => {
  try {
    const { 
      user_prompt, 
      weather_data, 
      capacity_data, 
      production_data, 
      additional_context 
    } = request.payload || {};
    
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
        details: {
          service_url: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000',
          instructions: [
            '1. Open a NEW terminal/command prompt',
            '2. Navigate to project: cd c:\\javascript-projects\\miningv',
            '3. Run: start_ai_service.bat',
            '4. Wait for message: "AI Service ready!"',
            '5. Try this request again'
          ]
        }
      }).code(503);
    }
    
    // Call Python AI service
    const result = await makeAIRequest('/api/ai/llm/recommend', {
      user_prompt,
      weather_data,
      capacity_data,
      production_data,
      additional_context
    });
    
    return h.response({
      error: false,
      status: 200,
      data: result,
    }).code(200);
  } catch (error) {
    console.error('LLM recommendation error:', error);
    const errorResponse = formatPredictionError(error);
    return h.response(errorResponse).code(500);
  }
};

/**
 * Chat with LLM for general mining questions
 * POST /ai/llm/chat
 * Body: { message, context? }
 */
const chatWithLLM = async (request, h) => {
  try {
    const { message, context } = request.payload || {};
    
    if (!message) {
      return h.response({
        error: true,
        status: 400,
        message: 'message is required',
      }).code(400);
    }
    
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
      }).code(503);
    }
    
    // Call Python AI service
    const result = await makeAIRequest('/api/ai/llm/chat', {
      message,
      context
    });
    
    return h.response({
      error: false,
      status: 200,
      data: result,
    }).code(200);
  } catch (error) {
    console.error('LLM chat error:', error);
    const errorResponse = formatPredictionError(error);
    return h.response(errorResponse).code(500);
  }
};

/**
 * Check LLM service status
 * GET /ai/llm/status
 */
const getLLMStatus = async (request, h) => {
  try {
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
        llm_available: false
      }).code(503);
    }
    
    // Call Python AI service
    const result = await makeAIRequest('/api/ai/llm/status', null, 'GET');
    
    return h.response({
      error: false,
      status: 200,
      data: result,
    }).code(200);
  } catch (error) {
    console.error('LLM status error:', error);
    return h.response({
      error: true,
      status: 500,
      message: 'Failed to check LLM status',
      error: error.message,
    }).code(500);
  }
};

// ============ RAG (Retrieval-Augmented Generation) Handlers ============

/**
 * RAG Health Check - Full health status
 * GET /ai/rag/health
 */
const ragHealthCheck = async (request, h) => {
  try {
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
        details: {
          service_url: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000',
          instructions: [
            '1. Open a NEW terminal/command prompt',
            '2. Navigate to Modelling directory',
            '3. Run: python api_service.py',
            '4. Wait for message: "Uvicorn running on http://0.0.0.0:8000"',
            '5. Try this request again'
          ]
        }
      }).code(503);
    }
    
    // Call Python AI service RAG health endpoint
    const result = await makeAIRequest('/api/ai/rag/health', null, 'GET');
    
    return h.response({
      error: false,
      message: 'RAG health check successful',
      data: result,
    }).code(200);
  } catch (error) {
    console.error('RAG health check error:', error);
    return h.response({
      error: true,
      status: 500,
      message: 'Failed to check RAG health',
      details: error.message,
    }).code(500);
  }
};

/**
 * RAG Quick Health Check
 * GET /ai/rag/health/quick
 */
const ragQuickHealth = async (request, h) => {
  try {
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
      }).code(503);
    }
    
    // Call Python AI service RAG quick health endpoint
    const result = await makeAIRequest('/api/ai/rag/health/quick', null, 'GET');
    
    return h.response({
      error: false,
      message: 'RAG quick health check successful',
      data: result,
    }).code(200);
  } catch (error) {
    console.error('RAG quick health check error:', error);
    return h.response({
      error: true,
      status: 500,
      message: 'Failed to check RAG quick health',
      details: error.message,
    }).code(500);
  }
};

/**
 * Get RAG Statistics
 * GET /ai/rag/stats
 */
const ragGetStats = async (request, h) => {
  try {
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
      }).code(503);
    }
    
    // Call Python AI service RAG stats endpoint
    const result = await makeAIRequest('/api/ai/rag/stats', null, 'GET');
    
    return h.response({
      error: false,
      message: 'RAG statistics retrieved successfully',
      data: result,
    }).code(200);
  } catch (error) {
    console.error('RAG stats error:', error);
    return h.response({
      error: true,
      status: 500,
      message: 'Failed to get RAG statistics',
      details: error.message,
    }).code(500);
  }
};

/**
 * RAG Chat - Chat with context from MySQL database
 * POST /ai/rag/chat
 * Body: { message, conversation_history?, include_rag_context? }
 */
const ragChat = async (request, h) => {
  try {
    const { message, conversation_history, include_rag_context } = request.payload || {};
    
    if (!message) {
      return h.response({
        error: true,
        status: 400,
        message: 'message is required',
      }).code(400);
    }
    
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
        details: {
          service_url: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000',
          instructions: [
            '1. Ensure Python AI service is running',
            '2. Run initial RAG ingestion: python rag_ingest.py',
            '3. Try this request again'
          ]
        }
      }).code(503);
    }
    
    // Call Python AI service RAG chat endpoint
    const result = await makeAIRequest('/api/ai/rag/chat', {
      message,
      conversation_history: conversation_history || [],
      include_rag_context: include_rag_context !== false
    });
    
    return h.response({
      error: false,
      message: 'RAG chat response berhasil',
      data: result,
    }).code(200);
  } catch (error) {
    console.error('RAG chat error:', error);
    const errorResponse = formatPredictionError(error);
    return h.response(errorResponse).code(500);
  }
};

/**
 * Trigger RAG Refresh - Refresh embeddings from MySQL
 * POST /ai/rag/refresh
 */
const ragRefresh = async (request, h) => {
  try {
    // Check if AI service is available first
    const isAIServiceHealthy = await checkAIServiceHealth();
    
    if (!isAIServiceHealthy) {
      return h.response({
        error: true,
        status: 503,
        message: 'AI Service is not available',
      }).code(503);
    }
    
    // Call Python AI service RAG refresh endpoint
    const result = await makeAIRequest('/api/ai/rag/refresh', {});
    
    return h.response({
      error: false,
      message: 'RAG refresh triggered successfully',
      data: result,
    }).code(200);
  } catch (error) {
    console.error('RAG refresh error:', error);
    return h.response({
      error: true,
      status: 500,
      message: 'Failed to trigger RAG refresh',
      details: error.message,
    }).code(500);
  }
};

module.exports = {

  checkAIHealth,
  forecastWeather,
  classifyWeather,
  predictCapacity,
  predictProduction,
  getAIRecommendations,
  // LLM handlers
  getLLMRecommendations,
  chatWithLLM,
  getLLMStatus,
  // RAG handlers
  ragHealthCheck,
  ragQuickHealth,
  ragGetStats,
  ragChat,
  ragRefresh,
};
