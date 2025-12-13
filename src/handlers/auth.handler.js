const { SECRET_KEY } = require('../config/auth');
const jwt = require('jsonwebtoken');
const pool = require('../data');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { verifyToken, verifyAdmin, verifyIsUser } = require('../middleware/auth.middleware');
const { sendEmail } = require('../helpers/email.helper');

exports.registerUser = async (req, h) => {
  const { nama, email, password, role } = req.payload;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
      [nama, email, hashedPassword, role]
    );

    return h.response({ message: 'Registrasi berhasil', error: false }).code(201);
  } catch (err) {
    console.error('Error saat registrasi:', err);
    return h.response({ message: 'Gagal registrasi', error: true }).code(500);
  }
};

exports.loginUser = async (req, h) => {
  const { email, password } = req.payload;

  try {
    const [rows] = await pool.query(
      'SELECT id, nama, email, password, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows.length) {
      return h.response({ message: 'Email tidak ditemukan', error: true }).code(404);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return h.response({ message: 'Password salah', error: true}).code(401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: '1h',
    });

    await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);

    return h.response({
      message: 'Login berhasil',
      error: false,
      data: { token, id: user.id, role: user.role, nama: user.nama }
    }).code(200);

  } catch (err) {
    console.error('Error saat login:', err);
    return h.response({ message: 'Terjadi kesalahan server', error: true }).code(500);
  }
};

exports.logoutUser = async (req, h) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return h.response({ message: 'Token tidak ditemukan', error: true }).code(400);
  }

  try {
    await pool.query('UPDATE users SET token = NULL WHERE token = ?', [token]);
    return h.response({ message: 'Logout berhasil', error: false }).code(200);
  } catch (err) {
    console.error('Error saat logout:', err);
    return h.response({ message: 'Gagal logout', error: true }).code(500);
  }
};

exports.forgotPassword = async (req, h) => {
  const { email } = req.payload;

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return h.response({ message: 'Email tidak terdaftar', error: true }).code(404);
    }

    const user = rows[0];

    await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 jam

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    const resetLink = `${process.env.BASE_URL}/#/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset Password',
      template: 'reset-password',
      variables: { resetLink },
    });

    return h.response({
      message: 'Email reset password telah dikirim',
      error: false,
    }).code(200);

  } catch (err) {
    console.error('Error saat forgot password:', err);
    return h.response({
      message: 'Gagal mengirim email reset password',
      error: true
    }).code(500);
  }
};

exports.resetPassword = async (req, h) => {
  const { token, newPassword } = req.payload;

  try {
    const [rows] = await pool.query(
      'SELECT id, user_id FROM password_resets WHERE token = ? AND expires_at > NOW() LIMIT 1',
      [token]
    );

    if (!rows.length) {
      return h.response({ message: 'Token tidak valid atau kadaluarsa', error: true }).code(400);
    }

    const resetData = rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [
      hashedPassword,
      resetData.user_id,
    ]);

    await pool.query('DELETE FROM password_resets WHERE id = ?', [resetData.id]);

    return h.response({ message: 'Password berhasil direset', error: false }).code(200);

  } catch (err) {
    console.error('Error saat reset password:', err);
    return h.response({ message: 'Gagal mereset password', error: true }).code(500);
  }
};

exports.getUserById = async (req, h) => {
  const verified = await verifyToken(req);
  if (verified.error) {
    return h.response({ message: verified.message, error: true }).code(verified.status);
  }

  const { id } = req.params;

  try {
    const { findById } = require('../helpers/database.helper');
    const user = await findById('users', 'id', id, 'id, nama, email, role');

    if (!user) {
      return h.response({
        message: 'Pengguna tidak ditemukan',
        error: true
      }).code(404);
    }

    return h.response({
      message: 'Profil berhasil diambil',
      error: false,
      data: user
    }).code(200);
  } catch (err) {
    console.error('Error saat mengambil profil:', err);
    return h.response({
      message: 'Gagal mengambil profil pengguna',
      error: true
    }).code(500);
  }
};

exports.updateUser = async (req, h) => {
  const verified = await verifyToken(req);
  if (verified.error) {
    return h.response({ message: verified.message, error: true }).code(verified.status);
  }

  const { id } = req.params;
  const { nama, email, password } = req.payload;

  try {
    let query = '';
    let params = [];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET nama = ?, email = ?, password = ?, updated_at = NOW() WHERE id = ?';
      params = [nama, email, hashedPassword, id];
    } else {
      query = 'UPDATE users SET nama = ?, email = ?, updated_at = NOW() WHERE id = ?';
      params = [nama, email, id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return h.response({
        message: 'Pengguna tidak ditemukan',
        error: true
      }).code(404);
    }

    return h.response({
      message: 'Profil berhasil diperbarui',
      error: false
    }).code(200);
  } catch (err) {
    console.error('Error saat update profil:', err);
    return h.response({
      message: 'Gagal memperbarui profil pengguna',
      error: true
    }).code(500);
  }
};

exports.updateRoleUser = async (req, h) => {
  const verified = await verifyAdmin(req);
  if (verified.error) {
    return h.response({ message: verified.message, error: true }).code(verified.status);
  }

  const { id } = req.params;
  const { role } = req.payload;

  if (!role || role.trim() === '') {
    return h.response({
      message: 'Field role tidak boleh kosong'
    }).code(400);
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return h.response({
        message: 'Pengguna tidak ditemukan',
        error: true
      }).code(404);
    }

    return h.response({
      message: 'Role pengguna berhasil diperbarui',
      error: false
    }).code(200);
  } catch (err) {
    console.error('Error saat update role pengguna:', err);
    return h.response({
      message: 'Gagal memperbarui role pengguna',
      error: true
    }).code(500);
  }
};

exports.deleteUser = async (req, h) => {
  const verified = await verifyIsUser(req);
  if (verified.error) {
    return h.response({ message: verified.message, error: true }).code(verified.status);
  }

  const { id } = req.params;

  try {
    const { deleteById } = require('../helpers/database.helper');
    const result = await deleteById('users', 'id', id);

    if (!result.success) {
      return h.response({ 
        message: 'Pengguna tidak ditemukan', 
        error: true 
      }).code(404);
    }

    return h.response({
      message: 'Profil berhasil dihapus',
      error: false
    }).code(200);
  } catch (err) {
    console.error('Error saat hapus profil:', err);
    return h.response({
      message: 'Gagal menghapus profil pengguna',
      error: true
    }).code(500);
  }
};