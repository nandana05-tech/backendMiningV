// src/handler.js
const pool = require('./data');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// const { error } = require('console');
// const fs = require('fs').promises;
// const path = require('path');
// const { request } = require('http');
// const { error } = require('console');

// const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(String('kuncirahasia'))
  .digest();
// const IV = Buffer.from('1234567890123456');

// function encrypt(text) {
//   const iv = crypto.randomBytes(16);
//   const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
//   let encrypted = cipher.update(text, 'utf8', 'base64');
//   encrypted += cipher.final('base64');
//   return `${iv.toString('hex')  }:${  encrypted}`;
// }

// function decrypt(encryptedText) {
//   try {
//     const [ivHex, encryptedBase64] = encryptedText.split(':');
//     const iv = Buffer.from(ivHex, 'hex');
//     const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
//     let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
//   } catch (err) {
//     console.error('Decrypt error:', err.message);
//     console.error('Teks yang gagal didecrypt:', encryptedText);
//     return null;
//   }
// }

// middleware untuk verifikasi token JWT
async function verifyToken(req, h) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return h
      .response({
        message: 'Token tidak ditemukan'
      })
      .code(401)
      .takeover();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND token = ?',
      [decoded.id, token]
    );

    if (rows.length === 0) {
      return h.response({
        message: 'Token tidak valid'
      }).code(403).takeover();
    }

    req.user = decoded;
    return req;
  } catch (err) {
    return h
      .response({
        message: 'Token tidak valid atau sudah kedaluwarsa',
        err
      })
      .code(403)
      .takeover();
  }
}

// verifikasi apakah user adalah admin berdasarkan role di token
async function verifyAdmin(req, h) {
  try {
    const verified = await verifyToken(req, h);
    if (verified.isBoom) return verified;

    const user = req.user;

    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [
      user.id,
    ]);
    if (rows.length === 0) {
      return h
        .response({ message: 'User tidak ditemukan di database' })
        .code(404)
        .takeover();
    }

    const currentRole = rows[0].role;

    if (currentRole !== 'admin') {
      return h
        .response({
          message: 'Akses ditolak: hanya admin yang dapat mengakses ini',
        })
        .code(403)
        .takeover();
    }

    return req;
  } catch (err) {
    console.error('Terjadi kesalahan di verifyAdmin:', err);
    return h
      .response({
        message: 'Terjadi kesalahan verifikasi admin'
      })
      .code(500)
      .takeover();
  }
}

// verifikasi apakah user adalah mine planner berdasarkan role di token
async function verifyMinePlanner(req, h) {
  try {
    const verified = await verifyToken(req, h);
    if (verified.isBoom) return verified;

    const user = req.user;

    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [
      user.id,
    ]);
    if (rows.length === 0) {
      return h
        .response({
          message: 'User tidak ditemukan di database'
        })
        .code(404)
        .takeover();
    }

    const currentRole = rows[0].role;

    if (currentRole !== 'mine_planner') {
      return h
        .response({
          message: 'Akses ditolak: hanya mine planner yang dapat mengakses ini',
        })
        .code(403)
        .takeover();
    }

    return req;
  } catch (err) {
    console.error('Terjadi kesalahan di verifyMinePlanner:', err);
    return h
      .response({
        message: 'Terjadi kesalahan verifikasi mine planner'
      })
      .code(500)
      .takeover();
  }
}

// verifikasi apakah user adalah shipping planner berdasarkan role di token
async function verifyShippingPlanner(req, h) {
  try {
    const verified = await verifyToken(req, h);
    if (verified.isBoom) return verified;

    const user = req.user;

    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [
      user.id,
    ]);
    if (rows.length === 0) {
      return h
        .response({
          message: 'User tidak ditemukan di database'
        })
        .code(404)
        .takeover();
    }

    const currentRole = rows[0].role;

    if (currentRole !== 'shipping_planner') {
      return h
        .response({
          message:
            'Akses ditolak: hanya shipping planner yang dapat mengakses ini',
        })
        .code(403)
        .takeover();
    }

    return req;
  } catch (err) {
    console.error('Terjadi kesalahan di verifyShippingPlanner:', err);
    return h
      .response({
        message: 'Terjadi kesalahan verifikasi shipping planner'
      })
      .code(500)
      .takeover();
  }
}

// Fungsi untuk melakukan verifikasi apakah user yang login adalah user dengan id yang sama dengan token yang dimiliki
async function verifyIsUser(req, h) {
  try {
    const verified = await verifyToken(req, h);
    console.log('=== HASIL verifyToken ===', verified);
    console.log('=== req.user ===', req.user);

    if (verified.isBoom) return verified;

    if (!req.user || !req.user.id) {
      console.error('req.user tidak ditemukan setelah verifyToken');
      return h
        .response({
          message: 'Token tidak valid atau user tidak ditemukan'
        })
        .code(403)
        .takeover();
    }

    const userId = String(req.user.id);
    const paramId = String(req.params.id);

    console.log('userId:', userId, '| paramId:', paramId);

    if (userId !== paramId) {
      return h
        .response({
          message:
            'Akses ditolak: anda tidak memiliki izin untuk mengakses ini',
        })
        .code(403)
        .takeover();
    }

    return req;
  } catch (err) {
    console.error('Terjadi kesalahan di verifyIsUser:', err);
    return h
      .response({
        message: 'Terjadi kesalahan saat memverifikasi user'
      })
      .code(500)
      .takeover();
  }
}

exports.registerUser = async (req, h) => {
  const { nama, email, password, role } = req.payload;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
      [nama, email, hashedPassword, role]
    );

    return h
      .response({
        message: 'Registrasi berhasil',
        error: false
      })
      .code(201);
  } catch (err) {
    console.error('Error saat registrasi:', err);
    return h.response({
      message: 'Gagal registrasi',
      error: true
    }).code(500);
  }
};

// Handlers untuk melakukan login pengguna
exports.loginUser = async (req, h) => {
  const { email, password } = req.payload;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);

    if (rows.length === 0) {
      return h.response({
        message: 'Email tidak ditemukan',
        error: true
      }).code(404);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return h.response({ message: 'Password salah', error: true}).code(401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: '1h',
    });

    await pool.query('UPDATE users SET token = ? WHERE id = ?', [
      token,
      user.id,
    ]);

    return h
      .response({
        message: 'Login berhasil',
        error: false,
        data: {
          token: token,
          id: user.id,
          role: user.role,
          nama: user.nama,
        },
      })
      .code(200);
  } catch (err) {
    console.error('Error saat login:', err);
    return h
      .response({
        message: 'Terjadi kesalahan server',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk melakukan logout pengguna
exports.logoutUser = async (req, h) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE users SET token = NULL WHERE id = ?', [id]);
    return h.response({
      message: 'Logout berhasil',
      error: false
    }).code(200);
  } catch (err) {
    console.error('Error saat logout:', err);
    return h.response({
      message: 'Gagal logout',
      error: true
    }).code(500);
  }
};

// Handlers untuk mengambil profil pengguna berdasarkan ID
exports.getUserById = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.isBoom) return verified;

  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT id, nama, email, role FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return h
        .response({
          message: 'Pengguna tidak ditemukan',
          error: true
        })
        .code(404);
    }

    return h
      .response({
        message: 'Profil berhasil diambil',
        error: false,
        data: rows[0]
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil profil:', err);
    return h
      .response({
        message: 'Gagal mengambil profil pengguna',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk memperbarui profil pengguna
exports.updateUser = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.isBoom) return verified;

  const { id } = req.params;
  const { nama, email, password } = req.payload;

  try {
    let query = '';
    let params = [];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query =
        'UPDATE users SET nama = ?, email = ?, password = ?, updated_at = NOW() WHERE id = ?';
      params = [nama, email, hashedPassword, id];
    } else {
      query =
        'UPDATE users SET nama = ?, email = ?, updated_at = NOW() WHERE id = ?';
      params = [nama, email, id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return h
        .response({
          message: 'Pengguna tidak ditemukan',
          error: true
        })
        .code(404);
    }

    return h
      .response({
        message: 'Profil berhasil diperbarui',
        error: false
      })
      .code(200);
  } catch (err) {
    console.error('Error saat update profil:', err);
    return h
      .response({
        message: 'Gagal memperbarui profil pengguna',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk memperbarui role pengguna (admin only)
exports.updateRoleUser = async (req, h) => {
  const verified = await verifyAdmin(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;
  const { role } = req.payload;

  if (!role || role.trim() === '') {
    return h
      .response({
        message: 'Field role tidak boleh kosong'
      })
      .code(400);
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return h
        .response({
          message: 'Pengguna tidak ditemukan',
          error: true
        })
        .code(404);
    }

    return h
      .response({
        message: 'Role pengguna berhasil diperbarui',
        error: false
      })
      .code(200);
  } catch (err) {
    console.error('Error saat update role pengguna:', err);
    return h
      .response({
        message: 'Gagal memperbarui role pengguna',
        error: true
      })
      .code(500);
  }
};

// Hapus Profil Pengguna by ID
exports.deleteUser = async (req, h) => {
  const verified = await verifyIsUser(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return h
        .response({ message: 'Pengguna tidak ditemukan', error: true })
        .code(404);
    }

    return h
      .response({
        message: 'Profil berhasil dihapus',
        error: false
      })
      .code(200);
  } catch (err) {
    console.error('Error saat hapus profil:', err);
    return h
      .response({
        message: 'Gagal menghapus profil pengguna',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk forgot password dengan mengirim email reset link
exports.forgotPassword = async (req, h) => {
  const { email } = req.payload;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);
    if (rows.length === 0) {
      return h
        .response({
          message: 'Email tidak terdaftar',
          error: true
        })
        .code(404);
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // token berlaku 1 jam

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    const myEmail = 'nandanasedangbelajar@gmail.com';
    const myPassword = 'vzmx rrmr lwzr kubt';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: myEmail,
        pass: myPassword,
      },
    });

    const baseUrl = 'http://localhost:5000';

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: myEmail,
      to: user.email,
      subject: 'Reset Password',
      html: `<p>Klik link berikut untuk reset password (berlaku 1 jam):</p><a href="${resetLink}">${resetLink}</a>`,
    });

    return h
      .response({
        message: 'Email reset password telah dikirim',
        error: false
      })
      .code(200);
  } catch (err) {
    console.error('Error forgot password:', err);
    return h
      .response({
        message: 'Gagal mengirim email reset password',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk reset password menggunakan token
exports.resetPassword = async (req, h) => {
  const { token, newPassword } = req.payload;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return h
        .response({
          message: 'Token tidak valid atau telah kadaluarsa',
          error: true,
        })
        .code(400);
    }

    const resetData = rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [
      hashedPassword,
      resetData.user_id,
    ]);

    await pool.query('DELETE FROM password_resets WHERE id = ?', [
      resetData.id,
    ]);

    return h
      .response({
        message: 'Password berhasil direset',
        error: false
      })
      .code(200);
  } catch (err) {
    console.error('Error reset password:', err);
    return h
      .response({
        message: 'Gagal mereset password',
        error: true
      })
      .code(500);
  }
};

// === MINES ===
// Handlers untuk mendapatkan semua data tambang
exports.getAllMines = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified !== req) return verified;

  try {
    const [result] = await pool.query(`
      SELECT mine_id, mine_name, location, region, start_date, status, remarks 
      FROM mine_master
    `);
    return h
      .response({
        message: 'Data tambang berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil semua data tambang:', err);
    return h
      .response({
        message: 'Gagal mengambil data tambang',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk mendapatkan data tambang berdasarkan ID
exports.getMineById = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `
      SELECT mine_id, mine_name, location, region, start_date, status, remarks 
      FROM mine_master
      WHERE mine_id = ?
    `,
      [id]
    );

    if (result.length === 0) {
      return h
        .response({
          message: 'Data tambang tidak ditemukan',
          error: true
        })
        .code(404);
    }

    return h
      .response({
        message: 'Data tambang berhasil diambil',
        error: false,
        data: result[0],
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data tambang:', err);
    return h
      .response({
        message: 'Gagal mengambil data tambang',
        error: true
      })
      .code(500);
  }
};

// === EQUIPMENTS ===
// Handlers untuk mendapatkan semua data equipment
exports.getAllEquipments = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified; // token invalid

  try {
    const [result] = await pool.query(`
      SELECT equipment_id, mine_id, equipment_type, brand, model, base_capacity_ton, last_maintenance, operator_id
      FROM equipment_inventory
    `);
    return h
      .response({
        message: 'Data equipment berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data equipment:', err);
    return h
      .response({
        message: 'Gagal mengambil data equipment',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk mendapatkan data equipment berdasarkan ID
exports.getEquipmentById = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `
      SELECT equipment_id, mine_id, equipment_type, brand, model, base_capacity_ton, last_maintenance, operator_id
      FROM equipment_inventory
      WHERE equipment_id = ?
    `,
      [id]
    );

    if (result.length === 0) {
      return h
        .response({
          message: 'Equipment tidak ditemukan',
          error: true
        })
        .code(404);
    }

    return h
      .response({
        message: 'Equipment berhasil diambil',
        error: false,
        data: result[0],
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data equipment:', err);
    return h
      .response({
        message: 'Gagal mengambil data equipment',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk menambahkan data equipment
exports.createEquipment = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const {
    mine_id,
    equipment_type,
    brand,
    model,
    base_capacity_ton,
    last_maintenance,
    operator_id,
  } = req.payload;

  try {
    const [result] = await pool.query(`
      SELECT equipment_id FROM equipment_inventory 
      ORDER BY equipment_id DESC 
      LIMIT 1
    `);

    let newId;

    if (result.length === 0) {
      newId = 'EQ000';
    } else {
      const lastId = result[0].equipment_id;
      const number = parseInt(lastId.slice(2));

      const next = (number + 1).toString().padStart(3, '0');

      newId = `EQ${next}`;
    }

    await pool.query(
      `
      INSERT INTO equipment_inventory 
      (equipment_id, mine_id, equipment_type, brand, model, base_capacity_ton, last_maintenance, operator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        newId,
        mine_id,
        equipment_type,
        brand,
        model,
        base_capacity_ton,
        last_maintenance,
        operator_id,
      ]
    );

    return h
      .response({
        message: 'Equipment berhasil ditambahkan',
        error: false,
        data: {
          equipment_id: newId,
        },
      })
      .code(201);
  } catch (err) {
    console.error('Error saat menambahkan equipment:', err);
    return h
      .response({
        message: 'Gagal menambahkan equipment',
        error: true
      })
      .code(500);
  }
};

// Handlers untuk memperbarui data equipment
exports.updateEquipment = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;
  const {
    mine_id,
    equipment_type,
    brand,
    model,
    base_capacity_ton,
    last_maintenance,
    operator_id,
  } = req.payload;

  try {
    const query = `
      UPDATE equipment_inventory
      SET mine_id = ?, equipment_type = ?, brand = ?, model = ?, base_capacity_ton = ?, last_maintenance = ?, operator_id = ?
      WHERE equipment_id = ?
    `;

    const [result] = await pool.query(query, [
      mine_id,
      equipment_type,
      brand,
      model,
      base_capacity_ton,
      last_maintenance,
      operator_id,
      id,
    ]);

    if (result.affectedRows === 0) {
      return h
        .response({
          message: 'Equipment tidak ditemukan',
          error: true
        })
        .code(404);
    }

    return h
      .response({
        message: 'Equipment berhasil diperbarui',
        error: false,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat memperbarui equipment:', err);
    return h
      .response({
        message: 'Gagal memperbarui equipment',
        error: true,
      })
      .code(500);
  }
};

// === EFFECTIVE CAPACITY ===
// Handlers untuk mendapatkan semua data effective capacity
exports.getEffectiveCapacity = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  try {
    const [result] = await pool.query('SELECT * FROM effective_capacity');
    return h
      .response({
        message: 'Data effective capacity berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data:', err);
    return h
      .response({
        message: 'Gagal mengambil data effective capacity',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk menambahkan data effective capacity
exports.createEffectiveCapacity = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const {
    mine_id,
    equipment_id,
    week_start,
    distance_km,
    road_condition,
    weather_condition,
    availability_pct,
    effective_capacity_ton_day,
    remark,
  } = req.payload;

  try {
    const [result] = await pool.query(`
      SELECT effcap_id 
      FROM effective_capacity 
      ORDER BY effcap_id DESC 
      LIMIT 1
    `);

    let newId;

    if (result.length === 0) {
      newId = 'EFC0000';
    } else {
      const lastId = result[0].effcap_id;
      const number = parseInt(lastId.slice(3));

      const next = (number + 1).toString().padStart(4, '0');
      newId = `EFC${next}`;
    }

    await pool.query(
      `
      INSERT INTO effective_capacity
      (effcap_id, mine_id, equipment_id, week_start, distance_km, road_condition, weather_condition, availability_pct, effective_capacity_ton_day, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        newId,
        mine_id,
        equipment_id,
        week_start,
        distance_km,
        road_condition,
        weather_condition,
        availability_pct,
        effective_capacity_ton_day,
        remark,
      ]
    );

    return h
      .response({
        message: 'Data effective capacity berhasil ditambahkan',
        error: false,
        data: {
          effcap_id: newId,
        },
      })
      .code(201);
  } catch (err) {
    console.error('Error saat menambahkan data:', err);
    return h
      .response({
        message: 'Gagal menambahkan data',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk memperbarui data effective capacity
exports.updateEffectiveCapacity = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;
  const {
    mine_id,
    equipment_id,
    week_start,
    distance_km,
    road_condition,
    weather_condition,
    availability_pct,
    effective_capacity_ton_day,
    remark,
  } = req.payload;

  try {
    const query = `
      UPDATE effective_capacity 
      SET mine_id = ?, equipment_id = ?, week_start = ?, distance_km = ?, road_condition = ?, weather_condition = ?, availability_pct = ?, effective_capacity_ton_day = ?, remark = ?
      WHERE effcap_id = ?
    `;
    const [result] = await pool.query(query, [
      mine_id,
      equipment_id,
      week_start,
      distance_km,
      road_condition,
      weather_condition,
      availability_pct,
      effective_capacity_ton_day,
      remark,
      id,
    ]);

    if (result.affectedRows === 0) {
      return h
        .response({
          message: 'Data tidak ditemukan',
          error: true,
        })
        .code(404);
    }

    return h
      .response({
        message: 'Data berhasil diperbarui',
        error: false,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat update data:', err);
    return h
      .response({
        message: 'Gagal memperbarui data',
        error: true,
      })
      .code(500);
  }
};

// === PRODUCTION CONSTRAINTS ===
// Handlers untuk mendapatkan semua data production constraints
exports.getProductionConstraints = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  try {
    const [result] = await pool.query(`
      SELECT 
        constraint_id,
        mine_id,
        equipment_id,
        week_start,
        constraint_type,
        capacity_value,
        unit,
        update_date,
        remarks
      FROM production_constraints
      ORDER BY constraint_id ASC
    `);

    return h
      .response({
        message: 'Data production constraints berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error getProductionConstraints:', err);
    return h
      .response({
        message: 'Gagal mengambil data production constraints',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk menambahkan data production constraint
exports.createProductionConstraint = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const {
    mine_id,
    equipment_id,
    week_start,
    constraint_type,
    capacity_value,
    unit,
    remarks,
  } = req.payload;

  try {
    const [result] = await pool.query(`
      SELECT constraint_id
      FROM production_constraints
      ORDER BY constraint_id DESC
      LIMIT 1
    `);

    let newId;

    if (result.length === 0) {
      newId = 'C0001';
    } else {
      const lastId = result[0].constraint_id;
      const number = parseInt(lastId.slice(1));

      const next = (number + 1).toString().padStart(4, '0');
      newId = `C${next}`;
    }

    const now = new Date();

    const update_date_formatted = now.toISOString().slice(0, 10);
    const update_date = update_date_formatted;

    await pool.query(
      `
      INSERT INTO production_constraints
      (constraint_id, mine_id, equipment_id, week_start, constraint_type, capacity_value, unit, update_date, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        newId,
        mine_id,
        equipment_id,
        week_start,
        constraint_type,
        capacity_value,
        unit,
        update_date,
        remarks,
      ]
    );

    return h
      .response({
        message: 'Data production constraint berhasil ditambahkan',
        error: false,
        data: {
          constraint_id: newId,
        },
      })
      .code(201);
  } catch (err) {
    console.error('Error createProductionConstraint:', err);
    return h
      .response({
        message: 'Gagal menambahkan data production constraint',
        error: true,
      })
      .code(500);
  }
};

// === PRODUCTION PLANS ===
// Handlers untuk mendapatkan semua data production plans
exports.getProductionPlans = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified !== req) return verified;

  try {
    const [result] = await pool.query(`
      SELECT
        plan_id,
        mine_id,
        week_start,
        planned_output_ton,
        actual_output_ton,
        target_variance_pct,
        status,
        updated_by
      FROM production_plan
      ORDER BY plan_id ASC
    `);

    return h
      .response({
        message: 'Data production plans berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error getProductionPlans:', err);
    return h
      .response({
        message: 'Gagal mengambil data production plans',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk menambahkan data production plan
exports.createProductionPlan = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const {
    mine_id,
    week_start,
    planned_output_ton,
    actual_output_ton,
    target_variance_pct,
    status,
    updated_by,
  } = req.payload;

  try {
    const [result] = await pool.query(`
      SELECT plan_id
      FROM production_plan
      ORDER BY plan_id DESC
      LIMIT 1
    `);

    let newId;

    if (result.length === 0) {
      newId = 'PLAN0000';
    } else {
      const lastId = result[0].plan_id;
      const number = parseInt(lastId.slice(5));

      const next = (number + 1).toString().padStart(4, '0');
      newId = `PLAN${next}`;
    }

    await pool.query(
      `
      INSERT INTO production_plan
      (plan_id, mine_id, week_start, planned_output_ton, actual_output_ton, target_variance_pct, status, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        newId,
        mine_id,
        week_start,
        planned_output_ton,
        actual_output_ton,
        target_variance_pct,
        status,
        updated_by,
      ]
    );
    return h
      .response({
        message: 'Data production plan berhasil ditambahkan',
        error: false,
        plan_id: newId,
      })
      .code(201);
  } catch (err) {
    console.error('Error createProductionPlan:', err);
    return h
      .response({
        message: 'Gagal menambahkan data production plan',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk memperbarui data production plan
exports.updateProductionPlan = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;
  const {
    mine_id,
    week_start,
    planned_output_ton,
    actual_output_ton,
    target_variance_pct,
    status,
    updated_by,
  } = req.payload;

  try {
    const query = `
      UPDATE production_plan
      SET mine_id = ?, week_start = ?, planned_output_ton = ?, actual_output_ton = ?, target_variance_pct = ?, status = ?, updated_by = ?
      WHERE plan_id = ?
    `;
    const [result] = await pool.query(query, [
      mine_id,
      week_start,
      planned_output_ton,
      actual_output_ton,
      target_variance_pct,
      status,
      updated_by,
      id,
    ]);

    if (result.affectedRows === 0) {
      return h
        .response({
          message: 'Data tidak ditemukan',
          error: true,
        })
        .code(404);
    }

    return h
      .response({
        message: 'Data berhasil diperbarui',
        error: false,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat update data:', err);
    return h
      .response({
        message: 'Gagal memperbarui data',
        error: true,
      })
      .code(500);
  }
};

// === WEATHER ===
// Handlers untuk mendapatkan semua data weather
exports.getWeatherData = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified !== req) return verified;

  try {
    const [result] = await pool.query('SELECT * FROM weather_data');
    return h
      .response({
        message: 'Data cuaca berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data cuaca:', err);
    return h
      .response({
        message: 'Gagal mengambil data cuaca',
        error: true,
      })
      .code(500);
  }
};

// === ROADS ===
// Handlers untuk mendapatkan semua data road conditions
exports.getRoadConditions = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified !== req) return verified;

  try {
    const [result] = await pool.query('SELECT * FROM road_condition');
    return h
      .response({
        message: 'Data kondisi jalan berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data kondisi jalan:', err);
    return h
      .response({
        message: 'Gagal mengambil data kondisi jalan',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk memperbarui data road condition
exports.updateRoadCondition = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;
  const {
    mine_id,
    segment_name,
    condition_level,
    accessibility_pct,
    last_inspection,
    remark,
  } = req.payload;
  try {
    const query = `
      UPDATE road_condition
      SET mine_id = ?, segment_name = ?, condition_level = ?, accessibility_pct = ?, last_inspection = ?, remark = ?
      WHERE road_id = ?
    `;
    const [result] = await pool.query(query, [
      mine_id,
      segment_name,
      condition_level,
      accessibility_pct,
      last_inspection,
      remark,
      id,
    ]);

    if (result.affectedRows === 0) {
      return h
        .response({
          message: 'Data tidak ditemukan',
          error: true,
        })
        .code(404);
    }

    return h
      .response({
        message: 'Data berhasil diperbarui',
        error: false,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat update data:', err);
    return h
      .response({
        message: 'Gagal memperbarui data',
        error: true,
      })
      .code(500);
  }
};

// === SHIPPING SCHEDULES ===
// Handlers untuk mendapatkan semua data shipping schedules
exports.getAllShippingSchedules = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified !== req) return verified;

  try {
    const [result] = await pool.query('SELECT * FROM shipping_schedule');
    return h
      .response({
        message: 'Data jadwal pengiriman berhasil diambil',
        error: false,
        data: result,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data jadwal pengiriman:', err);
    return h
      .response({
        message: 'Gagal mengambil data jadwal pengiriman',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk mendapatkan data shipping schedule berdasarkan ID
exports.getShippingScheduleById = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'SELECT * FROM shipping_schedule WHERE shipment_id = ?',
      [id]
    );

    if (result.length === 0) {
      return h
        .response({
          message: 'Data tidak ditemukan',
          error: true,
        })
        .code(404);
    }

    return h
      .response({
        message: 'Data berhasil diambil',
        error: false,
        data: result[0],
      })
      .code(200);
  } catch (err) {
    console.error('Error saat mengambil data jadwal pengiriman:', err);
    return h
      .response({
        message: 'Gagal mengambil data jadwal pengiriman',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk menambahkan data shipping schedule
exports.createShippingSchedule = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified !== req) return verified;

  const {
    mine_id,
    week_start,
    vessel_name,
    destination_port,
    coal_tonnage,
    etd,
    eta,
    status,
  } = req.payload;

  try {
    const [result] = await pool.query(`
      SELECT shipment_id  
      FROM shipping_schedule
      ORDER BY shipment_id DESC
      LIMIT 1
    `);

    let newId;

    if (result.length === 0) {
      newId = 'SHP0000';
    } else {
      const lastId = result[0].shipment_id;
      const number = parseInt(lastId.slice(4));

      const next = (number + 1).toString().padStart(4, '0');
      newId = `SHP${next}`;
    }

    await pool.query(
      `INSERT INTO shipping_schedule (shipment_id, mine_id, week_start, vessel_name, destination_port, coal_tonnage, etd, eta, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        mine_id,
        week_start,
        vessel_name,
        destination_port,
        coal_tonnage,
        etd,
        eta,
        status,
      ]
    );

    return h
      .response({
        message: 'Jadwal pengiriman berhasil dibuat',
        error: false,
        data: {
          shipment_id: newId,
        },
      })
      .code(201);
  } catch (err) {
    console.error('Error saat membuat jadwal pengiriman:', err);
    return h
      .response({
        message: 'Gagal membuat jadwal pengiriman',
        error: true,
      })
      .code(500);
  }
};

// Handlers untuk memperbarui data shipping schedule
exports.updateShippingSchedule = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified !== req) return verified;

  const { id } = req.params;
  const {
    mine_id,
    week_start,
    vessel_name,
    destination_port,
    coal_tonnage,
    etd,
    eta,
    status,
  } = req.payload;

  try {
    const query = `
      UPDATE shipping_schedule
      SET mine_id = ?, week_start = ?, vessel_name = ?, destination_port = ?, coal_tonnage = ?, etd = ?, eta = ?, status = ?
      WHERE shipment_id = ?
    `;

    const [result] = await pool.execute(query, [
      mine_id,
      week_start,
      vessel_name,
      destination_port,
      coal_tonnage,
      etd,
      eta,
      status,
      id,
    ]);

    if (result.affectedRows === 0) {
      return h
        .response({
          message: 'Data tidak ditemukan',
          error: true,
        })
        .code(404);
    }

    return h
      .response({
        message: 'Data berhasil diperbarui',
        error: false,
      })
      .code(200);
  } catch (err) {
    console.error('Error saat update data:', err);
    return h
      .response({
        message: 'Gagal memperbarui data',
        error: true,
      })
      .code(500);
  }
};
