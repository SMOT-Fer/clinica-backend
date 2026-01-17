const db = require('../dbmanager/postgres');

class AuditoriaPersistence {

  /* =========================
   * 1. CREAR AUDITORÍA
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO auditoria (
        clinic_id,
        usuario_id,
        accion,
        tabla,
        registro_id,
        descripcion,
        fecha
      ) VALUES ($1, $2, $3, $4, $5, $6, now())
      RETURNING *
    `;

    const values = [
      data.clinic_id ?? null,
      data.usuario_id ?? null,
      data.accion,
      data.tabla,
      data.registro_id ?? null,
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
      FROM auditoria
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. BUSCAR CON FILTROS
   * ========================= */
  async buscar(filtros = {}) {
    const condiciones = [];
    const values = [];
    let idx = 1;

    if (filtros.clinic_id) {
      condiciones.push(`a.clinic_id = $${idx++}`);
      values.push(filtros.clinic_id);
    }

    if (filtros.texto_persona) {
      condiciones.push(`
        (
          p.dni ILIKE $${idx}
          OR p.nombres ILIKE $${idx}
          OR p.apellido_paterno ILIKE $${idx}
          OR p.apellido_materno ILIKE $${idx}
        )
      `);
      values.push(`%${filtros.texto_persona}%`);
      idx++;
    }

    if (filtros.accion) {
      condiciones.push(`a.accion ILIKE $${idx++}`);
      values.push(`%${filtros.accion}%`);
    }

    if (filtros.tabla) {
      condiciones.push(`a.tabla ILIKE $${idx++}`);
      values.push(`%${filtros.tabla}%`);
    }

    if (filtros.descripcion) {
      condiciones.push(`a.descripcion ILIKE $${idx++}`);
      values.push(`%${filtros.descripcion}%`);
    }

    if (filtros.fecha) {
      condiciones.push(`DATE(a.fecha) = $${idx++}`);
      values.push(filtros.fecha);
    }

    if (filtros.fecha_desde) {
      condiciones.push(`a.fecha >= $${idx++}`);
      values.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      condiciones.push(`a.fecha <= $${idx++}`);
      values.push(filtros.fecha_hasta);
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    const query = `
      SELECT
        a.*,
        p.dni,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno
      FROM auditoria a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN personas p ON p.id = u.persona_id
      ${where}
      ORDER BY a.fecha DESC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

}

module.exports = AuditoriaPersistence;
