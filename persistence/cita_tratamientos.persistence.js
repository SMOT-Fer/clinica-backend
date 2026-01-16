const db = require('../dbmanager/postgres');
const CitaTratamiento = require('../model/cita_tratamientos.model');

class CitaTratamientosDAO {

  constructor() {}

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new CitaTratamiento({
      id: row.id ?? null,
      cita_id: row.cita_id ?? null,
      tratamiento_id: row.tratamiento_id ?? null,
      precio_aplicado: row.precio_aplicado ?? null
    });
  }

  // 2️⃣ Insertar (asociar tratamiento a cita)
  async insert(model) {
    const query = `
      INSERT INTO cita_tratamientos (
        cita_id,
        tratamiento_id,
        precio_aplicado
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      model.cita_id,
      model.tratamiento_id,
      model.precio_aplicado
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update (correcciones / cambios de tratamiento / descuentos)
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar cita_tratamientos');
    }

    const query = `
      UPDATE cita_tratamientos
      SET
        tratamiento_id = $1,
        precio_aplicado = $2
      WHERE id = $3
      RETURNING *
    `;

    const values = [
      model.tratamiento_id,
      model.precio_aplicado,
      model.id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Delete (eliminar tratamiento de una cita antes de pago)
  async delete(id) {
    const query = `
      DELETE FROM cita_tratamientos
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rowCount === 1;
  }

  // 5️⃣ Buscar por filtros (SOLO por cita)
  async findByFilter(filter = {}) {
    if (!filter.cita_id) {
      throw new Error('cita_id es obligatorio para buscar tratamientos de una cita');
    }

    const query = `
      SELECT *
      FROM cita_tratamientos
      WHERE cita_id = $1
      ORDER BY id ASC
    `;

    const { rows } = await db.query(query, [filter.cita_id]);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = CitaTratamientosDAO;
