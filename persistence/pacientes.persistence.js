const db = require('../dbmanager/postgres');
const Paciente = require('../model/pacientes.model');

class PacientesDAO {

  constructor(clinicId) {
    if (!clinicId) {
      throw new Error('clinic_id es obligatorio para PacientesDAO');
    }
    this.clinicId = clinicId;
  }

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new Paciente({
      id: row.id ?? null,
      clinic_id: row.clinic_id ?? null,
      persona_id: row.persona_id ?? null,
      created_at: row.created_at ?? null
    });
  }

  // 2️⃣ Registrar paciente (persona + clínica)
  async insert(model) {
    const query = `
      INSERT INTO pacientes (
        clinic_id,
        persona_id
      ) VALUES ($1, $2)
      RETURNING *
    `;

    const values = [
      this.clinicId,
      model.persona_id
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Obtener paciente por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM pacientes
      WHERE id = $1
        AND clinic_id = $2
    `;

    const { rows } = await db.query(query, [id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Listar todos los pacientes de la clínica
  async listAll() {
    const query = `
      SELECT *
      FROM pacientes
      WHERE clinic_id = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query, [this.clinicId]);
    return rows.map(row => this.instantiate(row));
  }

  // 5️⃣ Buscar pacientes por datos de persona (LIKE)
  async findByFilter(filter = {}) {
    const conditions = ['p.clinic_id = $1'];
    const values = [this.clinicId];
    let idx = 2;

    if (filter.persona_text && filter.persona_text.trim() !== '') {
      const text = `%${filter.persona_text.trim()}%`;

      conditions.push(`
        (
          pe.dni ILIKE $${idx}
          OR pe.nombres ILIKE $${idx}
          OR pe.apellido_paterno ILIKE $${idx}
          OR pe.apellido_materno ILIKE $${idx}
        )
      `);

      values.push(text);
      idx++;
    }

    const query = `
      SELECT p.*
      FROM pacientes p
      INNER JOIN personas pe ON pe.id = p.persona_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = PacientesDAO;
