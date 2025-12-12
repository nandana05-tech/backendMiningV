const pool = require('../data');
const {verifyToken} = require('../middleware/auth.middleware');
const { fetchPaginatedComposite } = require('../helpers/pagination.helper');

exports.getWeatherData = async (req, h) => {
  const verified = await verifyToken(req, h);
  if (verified.error) return verified;

  try {
    const data = await fetchPaginatedComposite({
      table: "weather_data",
      select: `
        weather_id, mine_id, date, rainfall_mm,
        wind_speed_kmh, humidity_pct, remark
      `,
      dateColumn: "date",
      idColumn: "weather_id",

      limit: parseInt(req.query.limit) || 20,
      cursorDate: req.query.cursor_date || null,
      cursorId: req.query.cursor_id || null,

      start: req.query.start || null,
      end: req.query.end || null,

      all: req.query.all === "true",
    });

    return h
      .response({
        message: "Data cuaca berhasil diambil",
        error: false,
        ...data,
      })
      .code(200);

  } catch (err) {
    return h
      .response({
        message: "Gagal mengambil data cuaca",
        error: true,
      })
      .code(500);
  }
};