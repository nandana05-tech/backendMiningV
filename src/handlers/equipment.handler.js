const pool = require('../data');
const {verifyMinePlanner} = require('../middleware/auth.middleware');
const { fetchPaginatedData } = require('../helpers/pagination.helper');
const { generateNextId, insertRecord, updateRecord, findById } = require('../helpers/database.helper');

exports.getAllEquipments = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await fetchPaginatedData({
      table: "equipment_inventory",
      select: `
        equipment_id, mine_id, equipment_type, brand, model,
        base_capacity_ton, last_maintenance, operator_id
      `,
      dateColumn: "last_maintenance",
      limit,
      cursor: req.query.cursor,
      start: req.query.start,
      end: req.query.end,
      all: req.query.all === "true",
    });

    return h.response({
      message: "Data equipment berhasil diambil",
      error: false,
      limit,
      nextCursor: result.nextCursor,
      total: result.total,
      data: result.rows,
    }).code(200);

  } catch (err) {
    console.error("Error getAllEquipments:",err);

    return h.response({
      message: "Server error",
      error: true,
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    }).code(500);
  }
};

exports.getEquipmentById = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;

  try {
    const equipment = await findById(
      'equipment_inventory',
      'equipment_id',
      id,
      'equipment_id, mine_id, equipment_type, brand, model, base_capacity_ton, last_maintenance, operator_id'
    );

    if (!equipment) {
      return h.response({
        message: "Equipment tidak ditemukan",
        error: true
      }).code(404);
    }

    return h.response({
      message: "Berhasil",
      error: false,
      data: equipment,
    }).code(200);

  } catch (err) {
    console.error(err);
    return h.response({ message: "Server error", error: true }).code(500);
  }
};

exports.createEquipment = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const {
    mine_id,
    equipment_type,
    brand,
    model,
    base_capacity_ton,
    last_maintenance,
    operator_id,
  } = req.payload;

  try {
    // Generate ID baru menggunakan helper
    const newId = await generateNextId('equipment_inventory', 'equipment_id', 'EQ', 3);

    // Insert menggunakan helper
    await insertRecord('equipment_inventory', {
      equipment_id: newId,
      mine_id,
      equipment_type,
      brand,
      model,
      base_capacity_ton,
      last_maintenance,
      operator_id,
    });

    return h
      .response({
        message: "Equipment berhasil ditambahkan",
        error: false,
        data: { equipment_id: newId },
      })
      .code(201);
  } catch (err) {
    console.error(err);
    return h
      .response({ message: "Gagal menambahkan equipment", error: true })
      .code(500);
  }
};

exports.updateEquipment = async (req, h) => {
  const verified = await verifyMinePlanner(req, h);
  if (verified.error) return verified;

  const { id } = req.params;
  
  // Validasi payload
  if (!req.payload) {
    return h.response({
      message: "Payload tidak boleh kosong",
      error: true
    }).code(400);
  }

  const {
    mine_id,
    equipment_type,
    brand,
    model,
    base_capacity_ton,
    last_maintenance,
    operator_id,
  } = req.payload;

  try {
    const result = await updateRecord(
      'equipment_inventory',
      {
        mine_id,
        equipment_type,
        brand,
        model,
        base_capacity_ton,
        last_maintenance,
        operator_id,
      },
      'equipment_id',
      id
    );

    if (!result.success) {
      return h.response({
        message: "Equipment tidak ditemukan untuk update",
        error: true
      }).code(404);
    }

    return h.response({ message: "Update berhasil", error: false }).code(200);

  } catch (err) {
    console.error(err);
    return h.response({ message: "Server error", error: true }).code(500);
  }
};