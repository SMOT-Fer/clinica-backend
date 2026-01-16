const db = require('../dbmanager/postgres');
const Clinica = require('../model/clinicas.model');

class ClinicasDAO {

  constructor() {}

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new Clinica({
      id: row.id ?? null,
      nombre: row.nombre ?? null,
      ruc: row.ruc ?? null,
      direccion: row.direccion ?? null,
      telefono: row.telefono ?? null,
      plan: row.plan ?? 'free',
      activa: row.activa ?? true,
      created_at: row.created_at ?? null
    });
  }

  // 2️⃣ Crear clínica (onboarding)
  async insert(model) {
    const query = `
      INSERT INTO clinicas (
        nombre,
        ruc,
        direccion,
        telefono,
        plan,
        activa
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      model.nombre,
      model.ruc,
      model.direccion,
      model.telefono,
      model.plan ?? 'free',
      model.activa ?? true
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update administrativo
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar clínica');
    }

    const query = `
      UPDATE clinicas
      SET
        nombre = $1,
        ruc = $2,
        direccion = $3,
        telefono = $4,
        plan = $5
      WHERE id = $6
      RETURNING *
    `;

    const values = [
      model.nombre,
      model.ruc,
      model.direccion,
      model.telefono,
      model.plan,
      model.id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Activar / desactivar clínica (soft delete)
  async setActiva(id, activa) {
    const query = `
      UPDATE clinicas
      SET activa = $1
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, [activa, id]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 5️⃣ Obtener clínica por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM clinicas
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 6️⃣ Listar todas las clínicas (super admin)
  async listAll() {
    const query = `
      SELECT *
      FROM clinicas
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query);
    return rows.map(row => this.instantiate(row));
  }

  // 7️⃣ Buscar clínicas (búsqueda administrativa simple)
  async findByFilter(filter = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (filter.nombre) {
      conditions.push(`nombre ILIKE $${idx++}`);
      values.push(`%${filter.nombre}%`);
    }

    if (filter.ruc) {
      conditions.push(`ruc = $${idx++}`);
      values.push(filter.ruc);
    }

    if (filter.plan) {
      conditions.push(`plan = $${idx++}`);
      values.push(filter.plan);
    }

    if (typeof filter.activa === 'boolean') {
      conditions.push(`activa = $${idx++}`);
      values.push(filter.activa);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT *
      FROM clinicas
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = ClinicasDAO;
