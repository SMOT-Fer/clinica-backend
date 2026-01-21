const db = require('../dbmanager/postgres');

class CondicionesMedicasPersistence {

  /* =========================
   * 1. CREAR CONDICIÓN MÉDICA
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO condiciones_medicas (
        nombre,
        descripcion,
        created_at
      ) VALUES ($1, $2, now())
      RETURNING *
    `;

    const values = [
      data.nombre,
      data.descripcion ?? null
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
      FROM condiciones_medicas
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. BUSCAR / LISTAR
   * (buscador en tiempo real)
   * ========================= */
  async buscar(filtros = {}) {
    const condiciones = [];
    const values = [];
    let idx = 1;

    // Buscador por nombre
    if (filtros.nombre) {
      condiciones.push(`nombre ILIKE $${idx++}`);
      values.push(`%${filtros.nombre}%`);
    }

    // Filtro por descripcion
    if (filtros.descripcion) {
      condiciones.push(`descripcion ILIKE $${idx++}`);
      values.push(filtros.descripcion);
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    const query = `
      SELECT *
      FROM condiciones_medicas
      ${where}
      ORDER BY nombre ASC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  /* =========================
   * 4. ACTUALIZAR CONDICIÓN
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

    if (campos.length === 0) return null;

    const query = `
      UPDATE condiciones_medicas
      SET ${campos.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }

  /* =========================
  * 5. ELIMINAR CONDICIÓN MÉDICA
  * ========================= */
  async eliminar(id) {
    const query = `
      DELETE FROM condiciones_medicas
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
}

}

module.exports = CondicionesMedicasPersistence;
