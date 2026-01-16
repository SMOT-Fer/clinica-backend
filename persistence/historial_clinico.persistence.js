const db = require('../dbmanager/postgres');
const HistorialClinico = require('../model/historial_clinico.model');

class HistorialClinicoDAO {

  constructor(clinicId) {
    if (!clinicId) {
      throw new Error('clinic_id es obligatorio para HistorialClinicoDAO');
    }
    this.clinicId = clinicId;
  }

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new HistorialClinico({
      id: row.id ?? null,
      clinic_id: row.clinic_id ?? null,
      paciente_id: row.paciente_id ?? null,
      cita_id: row.cita_id ?? null,
      observaciones: row.observaciones ?? null,
      diagnostico: row.diagnostico ?? null,
      created_at: row.created_at ?? null
    });
  }

  // 2️⃣ Insertar historial clínico (al finalizar atención)
  async insert(model) {
    const query = `
      INSERT INTO historial_clinico (
        clinic_id,
        paciente_id,
        cita_id,
        observaciones,
        diagnostico
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      this.clinicId,
      model.paciente_id,
      model.cita_id,
      model.observaciones,
      model.diagnostico
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update (correcciones clínicas)
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar historial clínico');
    }

    const query = `
      UPDATE historial_clinico
      SET
        observaciones = $1,
        diagnostico = $2
      WHERE id = $3
        AND clinic_id = $4
      RETURNING *
    `;

    const values = [
      model.observaciones,
      model.diagnostico,
      model.id,
      this.clinicId
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Obtener historial clínico por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM historial_clinico
      WHERE id = $1
        AND clinic_id = $2
    `;

    const { rows } = await db.query(query, [id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 5️⃣ Buscar historial clínico (por paciente y/o cita)
  async findByFilter(filter = {}) {
    const conditions = ['clinic_id = $1'];
    const values = [this.clinicId];
    let idx = 2;

    if (filter.paciente_id) {
      conditions.push(`paciente_id = $${idx++}`);
      values.push(filter.paciente_id);
    }

    if (filter.cita_id) {
      conditions.push(`cita_id = $${idx++}`);
      values.push(filter.cita_id);
    }

    if (!filter.paciente_id && !filter.cita_id) {
      throw new Error('Debe especificar paciente_id o cita_id para buscar historial clínico');
    }

    const query = `
      SELECT *
      FROM historial_clinico
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = HistorialClinicoDAO;
