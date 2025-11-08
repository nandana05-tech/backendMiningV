const {
  registerUser,
  loginUser,
  logoutUser,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateRoleUser,
  getAllMines,
  getMineById,
  getAllEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  getEffectiveCapacity,
  createEffectiveCapacity,
  updateEffectiveCapacity,
  getProductionConstraints,
  createProductionConstraint,
  getProductionPlans,
  createProductionPlan,
  updateProductionPlan,
  getWeatherData,
  getRoadConditions,
  updateRoadCondition,
  getAllShippingSchedules,
  getShippingScheduleById,
  createShippingSchedule,
  updateShippingSchedule,
} = require("./handler");

const routes = [
  // User Management
  { method: "POST", path: "/register", handler: registerUser },
  { method: "POST", path: "/login", handler: loginUser },
  { method: "DELETE", path: "/logout/{id}", handler: logoutUser },

  // Profil Pengguna
  { method: "GET", path: "/users/{id}", handler: getUserById },
  { method: "PUT", path: "/users/{id}", handler: updateUser },
  { method: "PUT", path: "/users/{id}/role", handler: updateRoleUser },
  { method: "DELETE", path: "/users/{id}", handler: deleteUser },

  // Password Reset
  { method: "POST", path: "/forgot-password", handler: forgotPassword },
  { method: "POST", path: "/reset-password", handler: resetPassword },

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
