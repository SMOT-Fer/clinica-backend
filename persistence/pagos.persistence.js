const db = require('../dbmanager/postgres');

class PagosPersistence {

  /* =========================
   * CREAR PAGO
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO pagos (
        clinic_id,
        paciente_id,
        cita_id,
        monto,
        metodo,
        estado,
        fecha
      ) VALUES ($1, $2, $3, $4, $5, $6, now())
      RETURNING *
    `;

    const values = [
      data.clinic_id,
      data.paciente_id,
      data.cita_id,
      data.monto,
      data.metodo,
      data.estado
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * OBTENER PAGO POR CITA
   * ========================= */
  async obtenerPorCita(cita_id) {
    const query = `
      SELECT *
      FROM pagos
      WHERE cita_id = $1
    `;

    const { rows } = await db.query(query, [cita_id]);
    return rows[0] || null;
  }

  /* =========================
   * ACTUALIZAR PAGO
   * ========================= */
  async actualizar(id, data) {
    const campos = [];
    const values = [];
    let idx = 1;

    if (data.monto) {
      campos.push(`monto = $${idx++}`);
      values.push(data.monto);
    }

    if (data.metodo) {
      campos.push(`metodo = $${idx++}`);
      values.push(data.metodo);
    }

    if (data.estado) {
      campos.push(`estado = $${idx++}`);
      values.push(data.estado);
    }

    if (campos.length === 0) return null;

    campos.push(`fecha = now()`);
    const query = `
      UPDATE pagos
      SET ${campos.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }

  /* =========================
   * LISTAR / BUSCAR PAGOS (ADMIN)
   * ========================= */
  async buscar(filtros = {}) {
    if (!filtros.clinic_id) {
      throw new Error('clinic_id es obligatorio para buscar pagos');
    }

    const condiciones = [];
    const values = [];
    let idx = 1;

    // Scope por clínica
    condiciones.push(`p.clinic_id = $${idx++}`);
    values.push(filtros.clinic_id);

    // Estado de pago
    if (filtros.estado) {
      condiciones.push(`p.estado = $${idx++}`);
      values.push(filtros.estado);
    }

    // Método de pago
    if (filtros.metodo) {
      condiciones.push(`p.metodo = $${idx++}`);
      values.push(filtros.metodo);
    }

    // Monto (búsqueda humana)
    if (filtros.monto) {
      condiciones.push(`CAST(p.monto AS TEXT) ILIKE $${idx++}`);
      values.push(`%${filtros.monto}%`);
    }

    // Fecha especifica
    if (filtros.fecha) {
      condiciones.push(`p.fecha = $${idx++}`);
      values.push(`%${filtros.fecha}%`);
    }

    // Rango de fechas (OBLIGATORIO EN UI)
    if (filtros.fecha_desde) {
      condiciones.push(`p.fecha >= $${idx++}`);
      values.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      condiciones.push(`p.fecha <= $${idx++}`);
      values.push(filtros.fecha_hasta);
    }

    // Búsqueda por persona (paciente)
    if (filtros.persona) {
      condiciones.push(`
        (
          per.dni ILIKE $${idx}
          OR per.nombres ILIKE $${idx}
          OR per.apellido_paterno ILIKE $${idx}
          OR per.apellido_materno ILIKE $${idx}
        )
      `);
      values.push(`%${filtros.persona}%`);
      idx++;
    }

    const query = `
      SELECT
        p.id,
        p.monto,
        p.metodo,
        p.estado,
        p.fecha,
        per.dni,
        per.nombres,
        per.apellido_paterno,
        per.apellido_materno
      FROM pagos p
      INNER JOIN pacientes pa ON pa.id = p.paciente_id
      INNER JOIN personas per ON per.id = pa.persona_id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY p.fecha DESC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }
}

module.exports = PagosPersistence;
