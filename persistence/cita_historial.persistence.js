const db = require('../dbmanager/postgres');
const CitaHistorial = require('../model/cita_historial.model');

class CitaHistorialDAO {

  // 🔹 No requiere clinic_id
  constructor() {}

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new CitaHistorial({
      id: row.id ?? null,
      cita_id: row.cita_id ?? null,
      fecha_anterior: row.fecha_anterior ?? null,
      hora_anterior: row.hora_anterior ?? null,
      fecha_nueva: row.fecha_nueva ?? null,
      hora_nueva: row.hora_nueva ?? null,
      usuario_id: row.usuario_id ?? null,
      motivo: row.motivo ?? null,
      created_at: row.created_at ?? null
    });
  }

  // 2️⃣ Insertar (función principal)
  async insert(model) {
    const query = `
      INSERT INTO cita_historial (
        cita_id,
        fecha_anterior,
        hora_anterior,
        fecha_nueva,
        hora_nueva,
        usuario_id,
        motivo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      model.cita_id,
      model.fecha_anterior,
      model.hora_anterior,
      model.fecha_nueva,
      model.hora_nueva,
      model.usuario_id,
      model.motivo
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Buscar por filtros (AND combinable)
  async findByFilter(filter = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    // 🔐 Aislamiento por clínica (vía cita)
    conditions.push(`c.clinic_id = $${idx++}`);
    values.push(filter.clinic_id);

    // 📌 Historial por cita
    if (filter.cita_id) {
      conditions.push(`ch.cita_id = $${idx++}`);
      values.push(filter.cita_id);
    }

    // 👤 Historial por usuario
    if (filter.usuario_id) {
      conditions.push(`ch.usuario_id = $${idx++}`);
      values.push(filter.usuario_id);
    }

    // 🔒 Protección mínima: al menos un filtro
    if (!filter.cita_id && !filter.usuario_id) {
      throw new Error('Debe especificar cita_id o usuario_id para buscar historial');
    }

    const query = `
      SELECT ch.*
      FROM cita_historial ch
      INNER JOIN citas c ON c.id = ch.cita_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ch.created_at DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }

}

module.exports = CitaHistorialDAO;
