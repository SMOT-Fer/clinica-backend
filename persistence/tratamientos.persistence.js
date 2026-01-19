const db = require('../dbmanager/postgres');

class TratamientosPersistence {

  /* =========================
   * 1. CREAR TRATAMIENTO
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO tratamientos (
        clinic_id,
        nombre,
        descripcion,
        precio,
        activo
      ) VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;

    const values = [
      data.clinic_id,
      data.nombre,
      data.descripcion ?? null,
      data.precio
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 2. OBTENER POR ID
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT *
      FROM tratamientos
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. BUSCAR / LISTAR TRATAMIENTOS
   * ========================= */
  async buscar(filtros = {}) {
    if (!filtros.clinic_id) {
      throw new Error('clinic_id es obligatorio para buscar tratamientos');
    }

    const condiciones = [];
    const values = [];
    let idx = 1;

    // Scope por clínica
    condiciones.push(`clinic_id = $${idx++}`);
    values.push(filtros.clinic_id);

    // Texto (nombre / descripción)
    if (filtros.texto) {
      condiciones.push(`
        (
          nombre ILIKE $${idx}
          OR descripcion ILIKE $${idx}
        )
      `);
      values.push(`%${filtros.texto}%`);
      idx++;
    }

    // Precio (búsqueda humana)
    if (filtros.precio) {
      condiciones.push(`CAST(precio AS TEXT) ILIKE $${idx++}`);
      values.push(`%${filtros.precio}%`);
    }

    // Activo / inactivo
    if (typeof filtros.activo === 'boolean') {
      condiciones.push(`activo = $${idx++}`);
      values.push(filtros.activo);
    }

    const query = `
      SELECT *
      FROM tratamientos
      WHERE ${condiciones.join(' AND ')}
      ORDER BY nombre ASC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  /* =========================
   * 4. ACTUALIZAR TRATAMIENTO
   * ========================= */
  async actualizar(id, data) {
    const campos = [];
    const values = [];
    let idx = 1;

    if (data.nombre) {
      campos.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }

    if (data.descripcion !== undefined) {
      campos.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }

    if (data.precio !== undefined) {
      campos.push(`precio = $${idx++}`);
      values.push(data.precio);
    }

    if (typeof data.activo === 'boolean') {
      campos.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (campos.length === 0) return null;

    const query = `
      UPDATE tratamientos
      SET ${campos.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }
}

module.exports = TratamientosPersistence;
