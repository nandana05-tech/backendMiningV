const pool = require('../data');
const {verifyMinePlanner} = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');
const { generateNextId, insertRecord, updateRecord } = require('../helpers/database.helper');

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

  if (!mine_id || !equipment_id) {
    return h.response({ message: 'mine_id dan equipment_id wajib diisi', error: true }).code(400);
  }

  try {
    const newId = await generateNextId('effective_capacity', 'effcap_id', 'EFC', 4);

    await insertRecord('effective_capacity', {
      effcap_id: newId,
      mine_id,
      equipment_id,
      week_start,
      distance_km,
      road_condition,
      weather_condition,
      availability_pct,
      effective_capacity_ton_day,
      remark,
    });

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
  
  // Validasi payload
  if (!req.payload) {
    return h.response({ error: true, message: 'Payload tidak boleh kosong' }).code(400);
  }

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
    const result = await updateRecord(
      'effective_capacity',
      {
        mine_id,
        equipment_id,
        week_start,
        distance_km,
        road_condition,
        weather_condition,
        availability_pct,
        effective_capacity_ton_day,
        remark,
      },
      'effcap_id',
      id
    );

    if (!result.success) {
      return h.response({ error: true, message: 'ID tidak ditemukan' }).code(404);
    }

    return h.response({ message: 'Berhasil update', error: false }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Gagal update', error: true }).code(500);
  }
};
