const pool = require('../data');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth.middleware');

exports.getUserById = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

  const { id } = req.params;

  try {
    const { findById } = require('../helpers/database.helper');
    const user = await findById('users', 'id', id, 'id, nama, email, role');

    if (!user) {
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
        data: user
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
    const { buildDynamicUpdate } = require('../helpers/database.helper');
    
    const updateData = { nama, email };
    
    // If password is provided, hash it and add to update data
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const result = await buildDynamicUpdate('users', updateData, 'id', id);

    if (!result.success) {
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
    const { deleteById } = require('../helpers/database.helper');
    const result = await deleteById('users', 'id', id);

    if (!result.success) {
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