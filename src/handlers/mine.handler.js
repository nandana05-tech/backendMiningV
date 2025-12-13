const pool = require('../data');
const { verifyToken } = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');
const { findById } = require('../helpers/database.helper');

exports.getAllMines = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const { rows, nextCursor, total } = await fetchPaginatedData({
      table: "mine_master",
      select: `
        mine_id, mine_name, location, region,
        start_date, status, remarks
      `,
      dateColumn: "start_date",
      limit,
      cursor: req.query.cursor,
      start: req.query.start,
      end: req.query.end,
      all: req.query.all === "true",
    });

    return h.response({
      message: "Data tambang berhasil diambil",
      error: false,
      limit,
      nextCursor,
      total,
      data: rows,
    }).code(200);

  } catch (err) {
    console.error("Error getAllMines:", err);
    return h.response({
      message: "Gagal mengambil data tambang",
      error: true,
    }).code(500);
  }
};

exports.getMineById = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

  const { id } = req.params;

  try {
    const mine = await findById(
      'mine_master',
      'mine_id',
      id,
      'mine_id, mine_name, location, region, start_date, status, remarks'
    );

    if (!mine) {
      return h
        .response({
          message: 'Data tambang tidak ditemukan',
          error: true
        })
        .code(404);
    }

    return h
      .response({
        message: 'Data tambang berhasil diambil',
        error: false,
        data: mine,
      })
      .code(200);

  } catch (err) {
    console.error('Error saat mengambil data tambang:', err);
    return h
      .response({
        message: 'Gagal mengambil data tambang',
        error: true
      })
      .code(500);
  }
};