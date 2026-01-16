const db = require('../dbmanager/postgres');
const Auditoria = require('../model/auditoria.model');

class AuditoriaDAO {
  constructor(clinicId) {
    if (!clinicId) {
      throw new Error('clinic_id es obligatorio para AuditoriaDAO');
    }
    this.clinicId = clinicId;
  }

  instantiate(row) {
    if (!row) return null;

    return new Auditoria({
      id: row.id ?? null,
      clinic_id: row.clinic_id ?? null,
      usuario_id: row.usuario_id ?? null,
      accion: row.accion ?? null,
      tabla: row.tabla ?? null,
      registro_id: row.registro_id ?? null,
      descripcion: row.descripcion ?? null,
      fecha: row.fecha ?? null
    });
  }

  async insert(auditoriaModel) {
    const query = `
      INSERT INTO auditoria (
        clinic_id,
        usuario_id,
        accion,
        tabla,
        registro_id,
        descripcion
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      this.clinicId,
      auditoriaModel.usuario_id,
      auditoriaModel.accion,
      auditoriaModel.tabla,
      auditoriaModel.registro_id,
      auditoriaModel.descripcion
    ];

    const { rows } = await db.query(query, values);

    return this.instantiate(rows[0]);
  }

  async listAll() {
    const query = `
      SELECT *
      FROM auditoria
      WHERE clinic_id = $1
      ORDER BY fecha DESC
    `;

    const { rows } = await db.query(query, [this.clinicId]);

    return rows.map(row => this.instantiate(row));
  }

  async getById(id) {
    const query = `
      SELECT *
      FROM auditoria
      WHERE id = $1
        AND clinic_id = $2
    `;

    const { rows } = await db.query(query, [
      id,
      this.clinicId
    ]);

    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  async findByFilter(filter = {}) {
    const conditions = ['a.clinic_id = $1'];
    const values = [this.clinicId];
    let idx = 2;

    // 🔎 BÚSQUEDA TEXTUAL (ILIKE)
    if (filter.text && filter.text.trim() !== '') {
      const text = `%${filter.text.trim()}%`;

      conditions.push(`
        (
          p.dni ILIKE $${idx}
          OR p.nombres ILIKE $${idx}
          OR p.apellido_paterno ILIKE $${idx}
          OR p.apellido_materno ILIKE $${idx}
          OR a.accion ILIKE $${idx}
          OR a.tabla ILIKE $${idx}
          OR a.descripcion ILIKE $${idx}
        )
      `);

      values.push(text);
      idx++;
    }

    // 📅 FECHA EXACTA (un día)
    if (filter.fecha) {
      conditions.push(`DATE(a.fecha) = $${idx}`);
      values.push(filter.fecha);
      idx++;
    }

    // 📆 RANGO DE FECHAS
    if (filter.fechaDesde && filter.fechaHasta) {
      conditions.push(`a.fecha BETWEEN $${idx} AND $${idx + 1}`);
      values.push(filter.fechaDesde, filter.fechaHasta);
      idx += 2;
    }

    const query = `
      SELECT
        a.*
      FROM auditoria a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN personas p ON p.id = u.persona_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.fecha DESC
    `;

    const { rows } = await db.query(query, values);

    return rows.map(row => this.instantiate(row));
  }

}

module.exports = AuditoriaDAO;