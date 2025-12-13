const pool = require('../data');

/**
 * Generate ID berikutnya dengan format auto-increment
 * @param {string} tableName - Nama tabel
 * @param {string} idColumn - Nama kolom ID
 * @param {string} prefix - Prefix untuk ID (contoh: 'EFC', 'C')
 * @param {number} length - Panjang angka setelah prefix (default: 4)
 * @returns {Promise<string>} - ID baru yang di-generate
 */
exports.generateNextId = async (tableName, idColumn, prefix, length = 4) => {
  try {
    const prefixLength = prefix.length;
    
    const [result] = await pool.query(`
      SELECT CONCAT(
        ?,
        LPAD(
          COALESCE(MAX(CAST(SUBSTRING(??, ${prefixLength + 1}) AS UNSIGNED)), 0) + 1,
          ?,
          '0'
        )
      ) AS newId
      FROM ??
    `, [prefix, idColumn, length, tableName]);

    return result[0].newId;
  } catch (err) {
    console.error('Error generateNextId:', err);
    throw err;
  }
};

/**
 * Insert record ke tabel dengan data yang diberikan
 * @param {string} tableName - Nama tabel
 * @param {object} data - Object berisi kolom dan nilai
 * @returns {Promise<object>} - Result dari insert operation
 * 
 * Catatan: Untuk nilai SQL raw (seperti CURRENT_DATE()), gunakan format:
 * { column: { __isRaw: true, value: 'CURRENT_DATE()' } }
 */
exports.insertRecord = async (tableName, data) => {
  try {
    const columns = [];
    const values = [];
    const placeholders = [];

    for (const [key, val] of Object.entries(data)) {
      columns.push(key);
      
      // Check if value is raw SQL
      if (val && typeof val === 'object' && val.__isRaw) {
        placeholders.push(val.value);
      } else {
        placeholders.push('?');
        values.push(val);
      }
    }
    
    const query = `
      INSERT INTO ?? (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;

    const [result] = await pool.query(query, [tableName, ...values]);
    return result;
  } catch (err) {
    console.error('Error insertRecord:', err);
    throw err;
  }
};

/**
 * Helper untuk membuat raw SQL value
 * @param {string} sqlExpression - SQL expression seperti 'CURRENT_DATE()'
 * @returns {object} - Object dengan marker __isRaw
 */
exports.raw = (sqlExpression) => ({
  __isRaw: true,
  value: sqlExpression,
});

/**
 * Update record di tabel dengan data yang diberikan
 * @param {string} tableName - Nama tabel
 * @param {object} data - Object berisi kolom dan nilai yang akan diupdate
 * @param {string} whereColumn - Nama kolom untuk WHERE clause
 * @param {any} whereValue - Nilai untuk WHERE clause
 * @returns {Promise<object>} - Object dengan property { success: boolean, affectedRows: number }
 * 
 * Contoh penggunaan:
 * const result = await updateRecord('users', { name: 'John', age: 30 }, 'user_id', 123);
 * if (!result.success) {
 *   // Record tidak ditemukan
 * }
 */
exports.updateRecord = async (tableName, data, whereColumn, whereValue) => {
  try {
    const columns = [];
    const values = [];

    for (const [key, val] of Object.entries(data)) {
      columns.push(`${key} = ?`);
      values.push(val);
    }

    const query = `
      UPDATE ??
      SET ${columns.join(', ')}
      WHERE ?? = ?
    `;

    const [result] = await pool.query(query, [tableName, ...values, whereColumn, whereValue]);
    
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows,
    };
  } catch (err) {
    console.error('Error updateRecord:', err);
    throw err;
  }
};

/**
 * Find single record by ID
 * @param {string} tableName - Nama tabel
 * @param {string} idColumn - Nama kolom ID
 * @param {any} id - Nilai ID yang dicari
 * @param {string} selectColumns - Kolom yang akan diselect (default: '*')
 * @returns {Promise<object|null>} - Record yang ditemukan atau null jika tidak ada
 * 
 * Contoh penggunaan:
 * const user = await findById('users', 'id', 123, 'id, nama, email, role');
 * if (!user) {
 *   // Record tidak ditemukan
 * }
 */
exports.findById = async (tableName, idColumn, id, selectColumns = '*') => {
  try {
    const query = `
      SELECT ${selectColumns}
      FROM ??
      WHERE ?? = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [tableName, idColumn, id]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Error findById:', err);
    throw err;
  }
};

/**
 * Delete record by ID
 * @param {string} tableName - Nama tabel
 * @param {string} idColumn - Nama kolom ID
 * @param {any} id - Nilai ID yang akan dihapus
 * @returns {Promise<object>} - Object dengan property { success: boolean, affectedRows: number }
 * 
 * Contoh penggunaan:
 * const result = await deleteById('users', 'id', 123);
 * if (!result.success) {
 *   // Record tidak ditemukan
 * }
 */
exports.deleteById = async (tableName, idColumn, id) => {
  try {
    const query = `
      DELETE FROM ??
      WHERE ?? = ?
    `;

    const [result] = await pool.query(query, [tableName, idColumn, id]);
    
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows,
    };
  } catch (err) {
    console.error('Error deleteById:', err);
    throw err;
  }
};

/**
 * Build dynamic UPDATE query - hanya update field yang ada dalam data object
 * Berguna untuk conditional updates tanpa harus membuat multiple query strings
 * 
 * @param {string} tableName - Nama tabel
 * @param {object} data - Object berisi kolom dan nilai yang akan diupdate
 * @param {string} whereColumn - Nama kolom untuk WHERE clause
 * @param {any} whereValue - Nilai untuk WHERE clause
 * @param {object} options - Optional configuration
 * @param {boolean} options.autoTimestamp - Auto add updated_at = NOW() (default: true)
 * @returns {Promise<object>} - Object dengan property { success: boolean, affectedRows: number }
 * 
 * Contoh penggunaan:
 * // Hanya update nama dan email
 * const result = await buildDynamicUpdate('users', { nama: 'John', email: 'john@email.com' }, 'id', 123);
 * 
 * // Update dengan password juga
 * const result = await buildDynamicUpdate('users', { nama: 'John', email: 'john@email.com', password: 'hashed' }, 'id', 123);
 */
exports.buildDynamicUpdate = async (tableName, data, whereColumn, whereValue, options = {}) => {
  try {
    const { autoTimestamp = true } = options;
    const columns = [];
    const values = [];

    // Filter out undefined/null values dari data
    const filteredData = Object.entries(data).filter(([_, val]) => val !== undefined && val !== null);

    if (filteredData.length === 0) {
      throw new Error('No data to update');
    }

    for (const [key, val] of filteredData) {
      columns.push(`${key} = ?`);
      values.push(val);
    }

    // Auto add updated_at timestamp jika diaktifkan
    if (autoTimestamp) {
      columns.push('updated_at = NOW()');
    }

    const query = `
      UPDATE ??
      SET ${columns.join(', ')}
      WHERE ?? = ?
    `;

    const [result] = await pool.query(query, [tableName, ...values, whereColumn, whereValue]);
    
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows,
    };
  } catch (err) {
    console.error('Error buildDynamicUpdate:', err);
    throw err;
  }
};
