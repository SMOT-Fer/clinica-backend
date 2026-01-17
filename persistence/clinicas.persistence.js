const db = require('../dbmanager/postgres');

class ClinicasPersistence {

  /* =========================
   * 1. CREAR CLÍNICA
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO clinicas (
        nombre,
        ruc,
        direccion,
        telefono,
        plan,
        activa,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, true, now())
      RETURNING *
    `;

    const values = [
      data.nombre,
      data.ruc,
      data.direccion ?? null,
      data.telefono ?? null,
      data.plan
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 2. OBTENER CLÍNICA POR ID
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT *
      FROM clinicas
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. BUSCAR / LISTAR CLÍNICAS
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

    // Filtro por estado (activa / inactiva)
    if (typeof filtros.activa === 'boolean') {
      condiciones.push(`activa = $${idx++}`);
      values.push(filtros.activa);
    }

    // Filtro por plan (opcional)
    if (filtros.plan) {
      condiciones.push(`plan = $${idx++}`);
      values.push(filtros.plan);
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    const query = `
      SELECT *
      FROM clinicas
      ${where}
      ORDER BY nombre ASC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  /* =========================
   * 4. ACTUALIZAR CLÍNICA
   * ========================= */
  async actualizar(id, data) {
    const campos = [];
    const values = [];
    let idx = 1;

    if (data.nombre) {
      campos.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }

    if (data.ruc !== undefined) {
      campos.push(`ruc = $${idx++}`);
      values.push(data.ruc);
    }

    if (data.direccion !== undefined) {
      campos.push(`direccion = $${idx++}`);
      values.push(data.direccion);
    }

    if (data.telefono !== undefined) {
      campos.push(`telefono = $${idx++}`);
      values.push(data.telefono);
    }

    if (data.plan) {
      campos.push(`plan = $${idx++}`);
      values.push(data.plan);
    }

    if (typeof data.activa === 'boolean') {
      campos.push(`activa = $${idx++}`);
      values.push(data.activa);
    }

    if (campos.length === 0) return null;

    const query = `
      UPDATE clinicas
      SET ${campos.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }
}

module.exports = ClinicasPersistence;
