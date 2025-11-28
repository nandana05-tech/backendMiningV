const pool = require('../data');
const { verifyToken, verifyMinePlanner } = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');

exports.getProductionPlans = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const { rows, nextCursor, total } = await fetchPaginatedData({
      table: "production_plan",
      select: `
        plan_id, mine_id, week_start, planned_output_ton,
        actual_output_ton, target_variance_pct, status, updated_by
      `,
      dateColumn: "week_start",
      limit,
      cursor: req.query.cursor,
      start: req.query.start,
      end: req.query.end,
      all: req.query.all === "true",
    });

    return h.response({
      message: "Data production plans berhasil diambil",
      error: false,
      limit,
      nextCursor,
      total,
      data: rows,
    }).code(200);

  } catch (err) {
    console.error("Error getProductionPlans:", err);
    return h.response({
      message: "Gagal mengambil data production plans",
      error: true,
    }).code(500);
  }
};

exports.createProductionPlan = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

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
      const number = parseInt(lastId.slice(4));
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

exports.updateProductionPlan = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

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
      SET mine_id = ?, week_start = ?, planned_output_ton = ?, actual_output_ton = ?, 
          target_variance_pct = ?, status = ?, updated_by = ?
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
    console.error('Error updateProductionPlan:', err);
    return h
      .response({
        message: 'Gagal memperbarui data',
        error: true,
      })
      .code(500);
  }
};
