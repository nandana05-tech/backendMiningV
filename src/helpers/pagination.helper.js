const pool = require('../data');

async function fetchPaginatedData({
  table,
  select,
  dateColumn,
  limit,
  cursor,
  start,
  end,
  all,
}) {
  let where = "WHERE 1=1";
  const params = [];

  if (start && end) {
    where += ` AND ${dateColumn} BETWEEN ? AND ?`;
    params.push(start, end);
  }

  if (cursor) {
    where += ` AND ${dateColumn} < ?`;
    params.push(cursor);
  }

  // Jika user request semua data
  if (all) {
    const [rows] = await pool.query(
      `
      SELECT ${select}
      FROM ${table}
      ${where}
      ORDER BY ${dateColumn} DESC
      `,
      params
    );

    return {
      rows,
      nextCursor: null,
      total: rows.length,
    };
  }

  // Pagination normal
  const [rows] = await pool.query(
    `
    SELECT ${select}
    FROM ${table}
    ${where}
    ORDER BY ${dateColumn} DESC
    LIMIT ?
    `,
    [...params, limit]
  );

  const nextCursor = rows.length ? rows[rows.length - 1][dateColumn] : null;

  const [[{ total }]] = await pool.query(`
    SELECT COUNT(*) AS total
    FROM ${table}
    WHERE 1=1
    ${start && end ? ` AND ${dateColumn} BETWEEN '${start}' AND '${end}'` : ""}
  `);

  return { rows, nextCursor, total };
}

async function fetchPaginatedComposite({
  table,
  select,
  dateColumn, 
  idColumn,       
  limit,
  cursorDate,
  cursorId,
  start,
  end,
  all,
}) {
  try {
    let where = "WHERE 1=1";
    const params = [];

    // Filter date range
    if (start && end) {
      where += ` AND ${dateColumn} BETWEEN ? AND ?`;
      params.push(start, end);
    }

    // Composite cursor
    if (cursorDate && cursorId) {
      where += `
        AND (
          ${dateColumn} < ?
          OR (${dateColumn} = ? AND ${idColumn} < ?)
        )
      `;
      params.push(cursorDate, cursorDate, cursorId);
    }

    // Jika ambil semua data tanpa pagination
    if (all) {
      const [rows] = await pool.query(
        `
        SELECT ${select}
        FROM ${table}
        ${where}
        ORDER BY ${dateColumn} DESC, ${idColumn} DESC
        `,
        params
      );

      return {
        rows,
        total: rows.length,
        nextCursorDate: null,
        nextCursorId: null,
      };
    }

    // Pagination normal
    const [rows] = await pool.query(
      `
      SELECT ${select}
      FROM ${table}
      ${where}
      ORDER BY ${dateColumn} DESC, ${idColumn} DESC
      LIMIT ?
      `,
      [...params, limit]
    );

    // Hitung nextCursor
    let nextCursorDate = null;
    let nextCursorId = null;

    if (rows.length > 0) {
      const last = rows[rows.length - 1];
      nextCursorDate = last[dateColumn];
      nextCursorId = last[idColumn];
    }

    // Hitung total (tanpa cursor, tapi pakai date range)
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM ${table}
      WHERE 1=1
      ${start && end ? ` AND ${dateColumn} BETWEEN '${start}' AND '${end}'` : ""}
    `);

    return { rows, total, nextCursorDate, nextCursorId };

  } catch (err) {
    console.error("Error in fetchPaginatedComposite:", err);
    throw err;
  }
}

module.exports = { fetchPaginatedData, fetchPaginatedComposite };
