const pool = require('../data');
const {verifyMinePlanner} = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');

exports.getEffectiveCapacity = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await fetchPaginatedData({
      table: "effective_capacity",
      select: `
        effcap_id, mine_id, equipment_id, week_start, distance_km,
        road_condition, weather_condition, availability_pct,
        effective_capacity_ton_day, remark
      `,
      dateColumn: "week_start",
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
    console.error("Error getEffectiveCapacity:", err);

    return h.response({
      message: "Gagal mengambil data",
      error: true,
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    }).code(500);
  }
};

exports.createEffectiveCapacity = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const payload = req.payload;

  if (!payload.mine_id || !payload.equipment_id) {
    return h.response({ message: 'mine_id dan equipment_id wajib diisi', error: true }).code(400);
  }

  try {
    const [idResult] = await pool.query(`
      SELECT CONCAT('EFC', LPAD((COALESCE(MAX(CAST(SUBSTRING(effcap_id, 4) AS UNSIGNED)), 0) + 1), 4, '0')) AS newId
      FROM effective_capacity
    `);

    const newId = idResult[0].newId;

    await pool.query(
      `
      INSERT INTO effective_capacity
      (effcap_id, mine_id, equipment_id, week_start, distance_km,
       road_condition, weather_condition, availability_pct,
       effective_capacity_ton_day, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        newId,
        payload.mine_id,
        payload.equipment_id,
        payload.week_start,
        payload.distance_km,
        payload.road_condition,
        payload.weather_condition,
        payload.availability_pct,
        payload.effective_capacity_ton_day,
        payload.remark,
      ]
    );

    return h.response({
      message: 'Data baru ditambahkan',
      error: false,
      data: { effcap_id: newId },
    }).code(201);

  } catch (err) {
    console.error(err);
    return h.response({ message: 'Insert gagal', error: true }).code(500);
  }
};

exports.updateEffectiveCapacity = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;
  const payload = req.payload;

  try {
    const [exists] = await pool.query(`SELECT effcap_id FROM effective_capacity WHERE effcap_id = ?`, [id]);
    if (exists.length === 0)
      return h.response({ error: true, message: 'ID tidak ditemukan' }).code(404);

    const [result] = await pool.query(
      `
      UPDATE effective_capacity 
      SET ? 
      WHERE effcap_id = ?
      `,
      [payload, id]
    );

    return h.response({ message: 'Berhasil update', error: false }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Gagal update', error: true }).code(500);
  }
};
