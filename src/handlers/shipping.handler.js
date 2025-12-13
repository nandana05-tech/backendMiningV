const pool = require('../data');
const {verifyShippingPlanner} = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');
const { generateNextId, insertRecord, updateRecord } = require('../helpers/database.helper');

exports.getAllShippingSchedules = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const { rows, nextCursor, total } = await fetchPaginatedData({
      table: "shipping_schedule",
      select: `
        shipment_id, mine_id, week_start, vessel_name,
        destination_port, coal_tonnage, etd, eta, status
      `,
      dateColumn: "week_start",
      limit,
      cursor: req.query.cursor,
      start: req.query.start,
      end: req.query.end,
      all: req.query.all === "true",
    });

    return h.response({
      message: "Data jadwal pengiriman berhasil diambil",
      error: false,
      limit,
      nextCursor,
      total,
      data: rows,
    }).code(200);

  } catch (err) {
    console.error("Error getAllShippingSchedules:", err);
    return h
      .response({
        message: "Gagal mengambil data jadwal pengiriman",
        error: true,
      })
      .code(500);
  }
};

exports.getShippingScheduleById = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;

  try {
    const { findById } = require('../helpers/database.helper');
    const schedule = await findById(
      'shipping_schedule',
      'shipment_id',
      id,
      'shipment_id, mine_id, week_start, vessel_name, destination_port, coal_tonnage, etd, eta, status'
    );

    if (!schedule) {
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
        data: schedule,
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

exports.createShippingSchedule = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified.error) return verified;

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
    // Generate ID baru menggunakan helper
    const newId = await generateNextId('shipping_schedule', 'shipment_id', 'SHP', 4);

    // Insert menggunakan helper
    await insertRecord('shipping_schedule', {
      shipment_id: newId,
      mine_id,
      week_start,
      vessel_name,
      destination_port,
      coal_tonnage,
      etd,
      eta,
      status,
    });

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

exports.updateShippingSchedule = async (req, h) => {
  const verified = await verifyShippingPlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;
  
  // Validasi payload
  if (!req.payload) {
    return h.response({
      message: 'Payload tidak boleh kosong',
      error: true,
    }).code(400);
  }

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
    const result = await updateRecord(
      'shipping_schedule',
      {
        mine_id,
        week_start,
        vessel_name,
        destination_port,
        coal_tonnage,
        etd,
        eta,
        status,
      },
      'shipment_id',
      id
    );

    if (!result.success) {
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
