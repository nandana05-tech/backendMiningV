/**
 * AI Helper - Communication with Python AI Service
 */

const axios = require('axios');

const AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Make HTTP request to Python AI service with retry mechanism
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request payload (null for GET requests)
 * @param {string} method - HTTP method (GET or POST, default: POST)
 * @param {number} retries - Number of retries
 * @returns {Promise<object>} Response data
 */
const makeAIRequest = async (endpoint, data, method = 'POST', retries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const config = {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      let response;
      if (method.toUpperCase() === 'GET') {
        response = await axios.get(`${AI_SERVICE_URL}${endpoint}`, config);
      } else {
        response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, data, config);
      }
      
      return response.data;
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw new Error(
          error.response.data?.detail || 
          `AI Service error: ${error.response.statusText}`
        );
      }
      
      // Retry on server errors (5xx) or network errors
      if (attempt < retries) {
        console.log(`AI request failed, retrying... (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  // All retries failed
  throw new Error(
    `AI Service unavailable: ${lastError.message}. Please ensure Python service is running.`
  );
};

/**
 * Check if AI service is healthy
 * @returns {Promise<boolean>} Health status
 */
const checkAIServiceHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('AI Service health check failed:', error.message);
    return false;
  }
};

/**
 * Format weather data for AI service
 * @param {Array} weatherData - Weather data from database
 * @returns {Array} Formatted data
 */
const formatWeatherData = (weatherData) => {
  return weatherData.map(record => ({
    date: record.date,
    mine_id: record.mine_id,
    rainfall_mm: parseFloat(record.rainfall_mm) || 0,
    temperature_c: parseFloat(record.temperature_c) || 0,
    humidity_pct: parseFloat(record.humidity_pct) || 0,
    wind_speed_kmh: parseFloat(record.wind_speed_kmh) || 0,
  }));
};

/**
 * Format prediction error for user-friendly response
 * @param {Error} error - Error object
 * @returns {object} Formatted error response
 */
const formatPredictionError = (error) => {
  if (error.response?.data?.detail) {
    return {
      success: false,
      error: 'Prediction failed',
      details: error.response.data.detail,
    };
  }
  
  if (error.message.includes('AI Service unavailable')) {
    return {
      success: false,
      error: 'AI Service is currently unavailable',
      details: 'Please ensure the Python AI service is running on port 8000',
    };
  }
  
  return {
    success: false,
    error: 'Prediction error',
    details: error.message,
  };
};

module.exports = {
  makeAIRequest,
  checkAIServiceHealth,
  formatWeatherData,
  formatPredictionError,
  AI_SERVICE_URL,
};
