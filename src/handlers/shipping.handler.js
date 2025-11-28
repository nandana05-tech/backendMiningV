const pool = require('../data');
const {verifyShippingPlanner} = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');

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
    const [result] = await pool.query(
      'SELECT shipment_id, mine_id, week_start, vessel_name, destination_port, coal_tonnage, etd, eta, status FROM shipping_schedule WHERE shipment_id = ? LIMIT 1',
      [id]
    );

    if (result.length === 0) {
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
        data: result[0],
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
    const [result] = await pool.query(`
      SELECT shipment_id  
      FROM shipping_schedule
      ORDER BY shipment_id DESC
      LIMIT 1
    `);

    let newId;

    if (result.length === 0) {
      newId = 'SHP0000';
    } else {
      const lastId = result[0].shipment_id;
      const number = parseInt(lastId.slice(4));

      const next = (number + 1).toString().padStart(4, '0');
      newId = `SHP${next}`;
    }

    await pool.query(
      `INSERT INTO shipping_schedule (shipment_id, mine_id, week_start, vessel_name, destination_port, coal_tonnage, etd, eta, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        mine_id,
        week_start,
        vessel_name,
        destination_port,
        coal_tonnage,
        etd,
        eta,
        status,
      ]
    );

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
    const query = `
      UPDATE shipping_schedule
      SET mine_id = ?, week_start = ?, vessel_name = ?, destination_port = ?, coal_tonnage = ?, etd = ?, eta = ?, status = ?
      WHERE shipment_id = ?
    `;

    const [result] = await pool.execute(query, [
      mine_id,
      week_start,
      vessel_name,
      destination_port,
      coal_tonnage,
      etd,
      eta,
      status,
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
    console.error('Error saat update data:', err);
    return h
      .response({
        message: 'Gagal memperbarui data',
        error: true,
      })
      .code(500);
  }
};
