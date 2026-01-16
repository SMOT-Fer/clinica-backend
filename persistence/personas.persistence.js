const db = require('../dbmanager/postgres');
const Persona = require('../model/personas.model');

class PersonasDAO {

  constructor() {}

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new Persona({
      id: row.id ?? null,
      dni: row.dni ?? null,
      nombres: row.nombres ?? null,
      apellido_paterno: row.apellido_paterno ?? null,
      apellido_materno: row.apellido_materno ?? null,
      telefono: row.telefono ?? null,
      fecha_nacimiento: row.fecha_nacimiento ?? null,
      sexo: row.sexo ?? null,
      origen_datos: row.origen_datos ?? 'api',
      created_at: row.created_at ?? null,
      ultima_actualizacion: row.ultima_actualizacion ?? null
    });
  }

  // 2️⃣ Insertar persona (API o manual)
  async insert(model) {
    const query = `
      INSERT INTO personas (
        dni,
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
        fecha_nacimiento,
        sexo,
        origen_datos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      model.dni,
      model.nombres,
      model.apellido_paterno,
      model.apellido_materno,
      model.telefono,
      model.fecha_nacimiento,
      model.sexo,
      model.origen_datos ?? 'api'
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update (correcciones)
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar persona');
    }

    const query = `
      UPDATE personas
      SET
        nombres = $1,
        apellido_paterno = $2,
        apellido_materno = $3,
        telefono = $4,
        ultima_actualizacion = now()
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      model.nombres,
      model.apellido_paterno,
      model.apellido_materno,
      model.telefono,
      model.id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Obtener persona por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM personas
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 5️⃣ Obtener persona por DNI (CLAVE)
  async getByDni(dni) {
    const query = `
      SELECT *
      FROM personas
      WHERE dni = $1
    `;

    const { rows } = await db.query(query, [dni]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 6️⃣ Buscar personas (buscador)
  async findByFilter(filter = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (filter.texto && filter.texto.trim() !== '') {
      const text = `%${filter.texto.trim()}%`;

      conditions.push(`
        (
          dni ILIKE $${idx}
          OR nombres ILIKE $${idx}
          OR apellido_paterno ILIKE $${idx}
          OR apellido_materno ILIKE $${idx}
        )
      `);

      values.push(text);
      idx++;
    }

    if (conditions.length === 0) {
      throw new Error('Debe enviar texto para buscar personas');
    }

    const query = `
      SELECT *
      FROM personas
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = PersonasDAO;
