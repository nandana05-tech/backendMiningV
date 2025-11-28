const pool = require('../data');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/auth');

async function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return { error: true, status: 401, message: "Token tidak ditemukan" };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const [rows] = await pool.query(
      'SELECT id, role FROM users WHERE id = ? AND token = ? LIMIT 1',
      [decoded.id, token]
    );

    if (rows.length === 0) {
      return { error: true, status: 403, message: "Token tidak valid" };
    }

    return {
      user: rows[0],
      error: false
    };

  } catch (err) {
    return { error: true, status: 401, message: "Token tidak valid atau sudah kedaluwarsa" };
  }
}

function createRoleVerifier(expectedRole) {
  return async function (req) {
    const verified = await verifyToken(req);
    if (verified.error) return verified;

    if (verified.user.role !== expectedRole) {
      return {
        error: true,
        status: 403,
        message: `Akses ditolak: hanya ${expectedRole} yang dapat mengakses ini`
      };
    }

    return verified;
  };
}

const verifyAdmin = createRoleVerifier("admin");
const verifyMinePlanner = createRoleVerifier("mine_planner");
const verifyShippingPlanner = createRoleVerifier("shipping_planner");

async function verifyIsUser(req) {
  const verified = await verifyToken(req);
  if (verified.error) return verified;

  if (!verified.user) {
    return { error: true, status: 403, message: "Token tidak valid atau user tidak ditemukan" };
  }

  const userId = String(verified.user.id);
  const paramId = String(req.params.id);

  if (userId !== paramId) {
    return {
      error: true,
      status: 403,
      message: "Akses ditolak: anda tidak memiliki izin untuk mengakses ini"
    };
  }

  return { user: verified.user, error: false };
}

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyMinePlanner,
  verifyShippingPlanner,
  verifyIsUser,
};
