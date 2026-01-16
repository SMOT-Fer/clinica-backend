const db = require('../dbmanager/postgres');
const CondicionMedica = require('../model/condiciones_medicas.model');

class CondicionesMedicasDAO {

  constructor() {}

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new CondicionMedica({
      id: row.id ?? null,
      paciente_id: row.paciente_id ?? null,
      descripcion: row.descripcion ?? null
    });
  }

  // 2️⃣ Insertar condición médica
  async insert(model) {
    const query = `
      INSERT INTO condiciones_medicas (
        paciente_id,
        descripcion
      ) VALUES ($1, $2)
      RETURNING *
    `;

    const values = [
      model.paciente_id,
      model.descripcion
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update (corrección de descripción)
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar condición médica');
    }

    const query = `
      UPDATE condiciones_medicas
      SET descripcion = $1
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      model.descripcion,
      model.id
    ]);

    if (rows.length === 0) return null;
    return this.instantiate(rows[0]);
  }

  // 4️⃣ Delete (solo errores)
  async delete(id) {
    const query = `
      DELETE FROM condiciones_medicas
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rowCount === 1;
  }

  // 5️⃣ Buscar condiciones por paciente y descripción
  async findByFilter(filter = {}) {
    if (!filter.paciente_id) {
      throw new Error('paciente_id es obligatorio para buscar condiciones médicas');
    }

    const conditions = ['paciente_id = $1'];
    const values = [filter.paciente_id];
    let idx = 2;

    if (filter.descripcion && filter.descripcion.trim() !== '') {
      conditions.push(`descripcion ILIKE $${idx}`);
      values.push(`%${filter.descripcion.trim()}%`);
      idx++;
    }

    const query = `
      SELECT *
      FROM condiciones_medicas
      WHERE ${conditions.join(' AND ')}
      ORDER BY id ASC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = CondicionesMedicasDAO;
