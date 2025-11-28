const { registerUser, loginUser, logoutUser, getUserById, updateUser, deleteUser, forgotPassword, resetPassword, updateRoleUser } = require('./handlers/auth.handler');
const { getEffectiveCapacity, createEffectiveCapacity, updateEffectiveCapacity } = require('./handlers/capacity.handler');
const { getProductionConstraints, createProductionConstraint } = require('./handlers/constraint.handler');
const { getAllEquipments, getEquipmentById, createEquipment, updateEquipment } = require('./handlers/equipment.handler');
const { getAllMines, getMineById } = require('./handlers/mine.handler');
const { getProductionPlans, createProductionPlan, updateProductionPlan } = require('./handlers/production.handler');
const { getWeatherData } = require('./handlers/weather.handler');
const { getRoadConditions, updateRoadCondition } = require('./handlers/road.handler');
const { getAllShippingSchedules, getShippingScheduleById, createShippingSchedule, updateShippingSchedule } = require('./handlers/shipping.handler');

const routes = [
  // User Management
  { method: 'POST', path: '/register', handler: registerUser },
  { method: 'POST', path: '/login', handler: loginUser },
  { method: 'DELETE', path: '/logout/{id}', handler: logoutUser },

  // Profil Pengguna
  { method: 'GET', path: '/users/{id}', handler: getUserById },
  { method: 'PUT', path: '/users/{id}', handler: updateUser },
  { method: 'PUT', path: '/users/{id}/role', handler: updateRoleUser },
  { method: 'DELETE', path: '/users/{id}', handler: deleteUser },

  // Password Reset
  { method: 'POST', path: '/forgot-password', handler: forgotPassword },
  { method: 'POST', path: '/reset-password', handler: resetPassword },

  // === MINES ===
  { method: 'GET', path: '/mines', handler: getAllMines },
  { method: 'GET', path: '/mines/{id}', handler: getMineById },

  // === EQUIPMENTS ===
  { method: 'GET', path: '/equipments', handler: getAllEquipments },
  { method: 'GET', path: '/equipments/{id}', handler: getEquipmentById },
  { method: 'POST', path: '/equipments', handler: createEquipment },
  { method: 'PUT', path: '/equipments/{id}', handler: updateEquipment },

  // === EFFECTIVE CAPACITY ===
  { method: 'GET', path: '/effective-capacity', handler: getEffectiveCapacity },
  { method: 'POST', path: '/effective-capacity', handler: createEffectiveCapacity },
  { method: 'PUT', path: '/effective-capacity/{id}', handler: updateEffectiveCapacity },

  // === PRODUCTION CONSTRAINTS ===
  { method: 'GET', path: '/production-constraints', handler: getProductionConstraints },
  { method: 'POST', path: '/production-constraints', handler: createProductionConstraint },

  // === PRODUCTION PLANS ===
  { method: 'GET', path: '/production-plans', handler: getProductionPlans },
  { method: 'POST', path: '/production-plans', handler: createProductionPlan },
  { method: 'PUT', path: '/production-plans/{id}', handler: updateProductionPlan },

  // === WEATHER ===
  { method: 'GET', path: '/weather', handler: getWeatherData },

  // === ROADS ===
  { method: 'GET', path: '/roads', handler: getRoadConditions },
  { method: 'PUT', path: '/roads/{id}', handler: updateRoadCondition },

  // === SHIPPING SCHEDULES ===
  { method: 'GET', path: '/shipping-schedules', handler: getAllShippingSchedules },
  { method: 'GET', path: '/shipping-schedules/{id}', handler: getShippingScheduleById },
  { method: 'POST', path: '/shipping-schedules', handler: createShippingSchedule },
  { method: 'PUT', path: '/shipping-schedules/{id}', handler: updateShippingSchedule },
];

module.exports = routes;
