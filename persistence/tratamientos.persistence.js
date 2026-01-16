const db = require('../dbmanager/postgres');
const Tratamiento = require('../model/tratamientos.model');

class TratamientosDAO {

  constructor(clinicId) {
    if (!clinicId) {
      throw new Error('clinic_id es obligatorio para TratamientosDAO');
    }
    this.clinicId = clinicId;
  }

  // 1️⃣ Instanciar
  instantiate(row) {
    if (!row) return null;

    return new Tratamiento({
      id: row.id ?? null,
      clinic_id: row.clinic_id ?? null,
      nombre: row.nombre ?? null,
      descripcion: row.descripcion ?? null,
      precio: row.precio ?? null,
      activo: row.activo ?? true
    });
  }

  // 2️⃣ Crear tratamiento
  async insert(model) {
    const query = `
      INSERT INTO tratamientos (
        clinic_id,
        nombre,
        descripcion,
        precio,
        activo
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      this.clinicId,
      model.nombre,
      model.descripcion,
      model.precio,
      model.activo ?? true
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update catálogo
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar tratamiento');
    }

    const query = `
      UPDATE tratamientos
      SET
        nombre = $1,
        descripcion = $2,
        precio = $3
      WHERE id = $4
        AND clinic_id = $5
      RETURNING *
    `;

    const values = [
      model.nombre,
      model.descripcion,
      model.precio,
      model.id,
      this.clinicId
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Activar / desactivar tratamiento
  async setActivo(id, activo) {
    const query = `
      UPDATE tratamientos
      SET activo = $1
      WHERE id = $2
        AND clinic_id = $3
      RETURNING *
    `;

    const { rows } = await db.query(query, [activo, id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 5️⃣ Obtener tratamiento por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM tratamientos
      WHERE id = $1
        AND clinic_id = $2
    `;

    const { rows } = await db.query(query, [id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 6️⃣ Listar tratamientos
  async listAll({ incluirInactivos = false } = {}) {
    const conditions = ['clinic_id = $1'];
    const values = [this.clinicId];

    if (!incluirInactivos) {
      conditions.push('activo = true');
    }

    const query = `
      SELECT *
      FROM tratamientos
      WHERE ${conditions.join(' AND ')}
      ORDER BY nombre ASC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }

  // 7️⃣ Buscar tratamientos
  async findByFilter(filter = {}) {
    const conditions = ['clinic_id = $1'];
    const values = [this.clinicId];
    let idx = 2;

    if (filter.nombre && filter.nombre.trim() !== '') {
      conditions.push(`nombre ILIKE $${idx}`);
      values.push(`%${filter.nombre.trim()}%`);
      idx++;
    }

    if (typeof filter.activo === 'boolean') {
      conditions.push(`activo = $${idx}`);
      values.push(filter.activo);
      idx++;
    }

    const query = `
      SELECT *
      FROM tratamientos
      WHERE ${conditions.join(' AND ')}
      ORDER BY nombre ASC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = TratamientosDAO;
