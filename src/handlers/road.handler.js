const pool = require('../data');
const { verifyToken, verifyMinePlanner } = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');

exports.getRoadConditions = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const { rows, nextCursor, total } = await fetchPaginatedData({
      table: "road_condition",
      select: `
        road_id, mine_id, segment_name, condition_level,
        accessibility_pct, last_inspection, remark
      `,
      dateColumn: "last_inspection",
      limit,
      cursor: req.query.cursor,
      start: req.query.start,
      end: req.query.end,
      all: req.query.all === "true",
    });

    return h.response({
      message: "Data kondisi jalan berhasil diambil",
      error: false,
      limit,
      nextCursor,
      total,
      data: rows,
    }).code(200);

  } catch (err) {
    console.error("Error getRoadConditions:", err);
    return h
      .response({
        message: "Gagal mengambil data kondisi jalan",
        error: true,
      })
      .code(500);
  }
};

exports.updateRoadCondition = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;
  const {
    mine_id,
    segment_name,
    condition_level,
    accessibility_pct,
    last_inspection,
    remark,
  } = req.payload;
  try {
    const query = `
      UPDATE road_condition
      SET mine_id = ?, segment_name = ?, condition_level = ?, accessibility_pct = ?, last_inspection = ?, remark = ?
      WHERE road_id = ?
    `;
    const [result] = await pool.query(query, [
      mine_id,
      segment_name,
      condition_level,
      accessibility_pct,
      last_inspection,
      remark,
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