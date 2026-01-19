const db = require('../dbmanager/postgres');

class PersonasPersistence {

  /* =========================
   * 1. OBTENER PERSONA POR DNI
   * ========================= */
  async obtenerPorDni(dni) {
    const query = `
      SELECT *
      FROM personas
      WHERE dni = $1
    `;

    const { rows } = await db.query(query, [dni]);
    return rows[0] || null;
  }

  /* =========================
   * 2. OBTENER PERSONA POR ID
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT *
      FROM personas
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. CREAR PERSONA
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO personas (
        dni,
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
        fecha_nacimiento,
        sexo,
        origen_datos,
        created_at,
        ultima_actualizacion
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, now(), now()
      )
      RETURNING *
    `;

    const values = [
      data.dni,
      data.nombres,
      data.apellido_paterno,
      data.apellido_materno,
      data.telefono ?? null,
      data.fecha_nacimiento ?? null,
      data.sexo ?? null,
      data.origen_datos ?? 'manual'
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 4. ACTUALIZAR PERSONA
   * ========================= */
  async actualizar(id, data) {
    const campos = [];
    const values = [];
    let idx = 1;

    if (data.nombres) {
      campos.push(`nombres = $${idx++}`);
      values.push(data.nombres);
    }

    if (data.apellido_paterno) {
      campos.push(`apellido_paterno = $${idx++}`);
      values.push(data.apellido_paterno);
    }

    if (data.apellido_materno) {
      campos.push(`apellido_materno = $${idx++}`);
      values.push(data.apellido_materno);
    }

    if (data.telefono !== undefined) {
      campos.push(`telefono = $${idx++}`);
      values.push(data.telefono);
    }

    if (data.fecha_nacimiento !== undefined) {
      campos.push(`fecha_nacimiento = $${idx++}`);
      values.push(data.fecha_nacimiento);
    }

    if (data.sexo !== undefined) {
      campos.push(`sexo = $${idx++}`);
      values.push(data.sexo);
    }

    if (data.origen_datos) {
      campos.push(`origen_datos = $${idx++}`);
      values.push(data.origen_datos);
    }

    if (campos.length === 0) return null;

    const query = `
      UPDATE personas
      SET
        ${campos.join(', ')},
        ultima_actualizacion = now()
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }

  /* =========================
   * 5. BUSCAR PERSONAS (ADMIN)
   * ========================= */
  async buscar(filtros = {}) {
    const condiciones = [];
    const values = [];
    let idx = 1;

    if (filtros.texto) {
      condiciones.push(`
        (
          dni ILIKE $${idx}
          OR nombres ILIKE $${idx}
          OR apellido_paterno ILIKE $${idx}
          OR apellido_materno ILIKE $${idx}
        )
      `);
      values.push(`%${filtros.texto}%`);
      idx++;
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    const query = `
      SELECT *
      FROM personas
      ${where}
      ORDER BY apellido_paterno ASC, nombres ASC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }
}

module.exports = PersonasPersistence;
