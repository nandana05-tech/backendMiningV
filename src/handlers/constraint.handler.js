const pool = require('../data');
const { verifyMinePlanner } = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');

exports.getProductionConstraints = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await fetchPaginatedData({
      table: "production_constraints",
      select: `
        constraint_id, mine_id, equipment_id, week_start,
        constraint_type, capacity_value, unit,
        update_date, remarks
      `,
      dateColumn: "update_date",
      limit,
      cursor: req.query.cursor,
      start: req.query.start,
      end: req.query.end,
      all: req.query.all === "true",
    });

    return h.response({
      message: "Data berhasil diambil",
      error: false,
      limit,
      nextCursor: result.nextCursor,
      total: result.total,
      data: result.rows,
    }).code(200);

  } catch (err) {
    console.error("Error getProductionConstraints:", err);

    return h.response({
      message: "Gagal mengambil data",
      error: true,
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    }).code(500);
  }
};

exports.createProductionConstraint = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const {
    mine_id,
    equipment_id,
    week_start,
    constraint_type,
    capacity_value,
    unit,
    remarks,
  } = req.payload;

  if (!mine_id || !equipment_id || !week_start || !constraint_type) {
    return h.response({
      message: "Field wajib tidak boleh kosong",
      error: true,
    }).code(400);
  }

  try {
    const [idResult] = await pool.query(`
      SELECT CONCAT(
          'C',
          LPAD(
            COALESCE(MAX(CAST(SUBSTRING(constraint_id, 2) AS UNSIGNED)), 0) + 1,
            4,
            '0'
          )
        ) AS newId
      FROM production_constraints
    `); // example: C0001

    const newId = idResult[0].newId;


    await pool.query(
      `
      INSERT INTO production_constraints
      (constraint_id, mine_id, equipment_id, week_start, constraint_type, 
      capacity_value, unit, update_date, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?)
      `,
      [
        newId,
        mine_id,
        equipment_id,
        week_start,
        constraint_type,
        capacity_value,
        unit,
        remarks,
      ]
    );

    return h.response({
      message: 'Data berhasil ditambahkan',
      error: false,
      data: { constraint_id: newId },
    }).code(201);

  } catch (err) {
    console.error('Error createProductionConstraint:', err);
    return h.response({
      message: 'Gagal menambahkan data',
      error: true,
    }).code(500);
  }
};
