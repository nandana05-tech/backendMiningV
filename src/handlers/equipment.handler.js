const pool = require('../data');
const {verifyMinePlanner} = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');

exports.getAllEquipments = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await fetchPaginatedData({
      table: "equipment_inventory",
      select: `
        equipment_id, mine_id, equipment_type, brand, model,
        base_capacity_ton, last_maintenance, operator_id
      `,
      dateColumn: "last_maintenance",
      limit,
      cursor: req.query.cursor,
      start: req.query.start,
      end: req.query.end,
      all: req.query.all === "true",
    });

    return h.response({
      message: "Data equipment berhasil diambil",
      error: false,
      limit,
      nextCursor: result.nextCursor,
      total: result.total,
      data: result.rows,
    }).code(200);

  } catch (err) {
    console.error("Error getAllEquipments:", err);

    return h.response({
      message: "Server error",
      error: true,
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    }).code(500);
  }
};

exports.getEquipmentById = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `SELECT equipment_id, mine_id, equipment_type, brand, model, base_capacity_ton, last_maintenance, operator_id 
      FROM equipment_inventory 
      WHERE equipment_id = ? LIMIT 1`,
      [id]
    );

    if (!result.length) {
      return h.response({
        message: "Equipment tidak ditemukan",
        error: true
      }).code(404);
    }

    return h.response({
      message: "Berhasil",
      error: false,
      data: result[0],
    }).code(200);

  } catch (err) {
    console.error(err);
    return h.response({ message: "Server error", error: true }).code(500);
  }
};

exports.createEquipment = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const {
    mine_id,
    equipment_type,
    brand,
    model,
    base_capacity_ton,
    last_maintenance,
    operator_id,
  } = req.payload;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [idResult] = await conn.query(`
      SELECT CONCAT(
        'EQ',
        LPAD(
          COALESCE(MAX(CAST(SUBSTRING(equipment_id, 3) AS UNSIGNED)), 0) + 1,
          3,
          '0'
        )
      ) AS newId
      FROM equipment_inventory
      FOR UPDATE
    `);

    const newId = idResult[0].newId;

    await conn.query(
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

    await conn.commit();

    return h
      .response({
        message: "Equipment berhasil ditambahkan",
        error: false,
        data: { equipment_id: newId },
      })
      .code(201);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return h
      .response({ message: "Gagal menambahkan equipment", error: true })
      .code(500);
  } finally {
    conn.release();
  }
};

exports.updateEquipment = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;
  const {
    mine_id, equipment_type, brand,
    model, base_capacity_ton,
    last_maintenance, operator_id,
  } = req.payload;

  try {
    const [result] = await pool.query(
      `
      UPDATE equipment_inventory
      SET mine_id=?, equipment_type=?, brand=?, model=?, base_capacity_ton=?, last_maintenance=?, operator_id=?
      WHERE equipment_id=?
      `,
      [
        mine_id, equipment_type, brand, model,
        base_capacity_ton, last_maintenance,
        operator_id, id
      ]
    );

    if (!result.affectedRows) {
      return h.response({
        message: "Equipment tidak ditemukan untuk update",
        error: true
      }).code(404);
    }

    return h.response({ message: "Update berhasil", error: false }).code(200);

  } catch (err) {
    console.error(err);
    return h.response({ message: "Server error", error: true }).code(500);
  }
};