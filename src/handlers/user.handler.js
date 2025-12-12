const pool = require('../data');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth.middleware');

exports.getUserById = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

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

exports.updateUser = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

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

exports.updateRoleUser = async (req, h) => {
  const verified = await verifyAdmin(req, h);
  if (verified.error) return verified;

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

exports.deleteUser = async (req, h) => {
  const verified = await verifyIsUser(req, h);
  if (verified.error) return verified;

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