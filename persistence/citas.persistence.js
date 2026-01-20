const db = require('../dbmanager/postgres');

class CitasPersistence {

  /* =========================
   * CREAR CITA
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO citas (
        clinic_id,
        paciente_id,
        doctor_id,
        fecha,
        hora,
        estado,
        detalles,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      RETURNING *
    `;

    const values = [
      data.clinic_id,
      data.paciente_id,
      data.doctor_id,
      data.fecha,
      data.hora,
      data.estado,
      data.detalles ?? null
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * OBTENER CITA POR ID
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT c.fecha,
        c.hora,
        c.estado,
        c.detalles,
        c.created_at,
        pp.nombres AS paciente_nombres,
        pp.apellido_paterno AS paciente_apellido_paterno,
        pd.nombres AS doctor_nombres,
        pd.apellido_paterno AS doctor_apellido_paterno
      FROM citas c
      INNER JOIN pacientes pa ON pa.id = c.paciente_id
      INNER JOIN personas pp ON pp.id = pa.persona_id
      INNER JOIN usuarios u ON u.id = c.doctor_id
      INNER JOIN personas pd ON pd.id = u.persona_id
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * BUSCADOR DE CITAS
   * (admin / staff / doctor)
   * ========================= */
  async buscar(filtros = {}) {
    const condiciones = [];
    const values = [];
    let idx = 1;

    // Clínica (admin obligatorio / superadmin opcional)
    if (filtros.clinic_id) {
      condiciones.push(`c.clinic_id = $${idx++}`);
      values.push(filtros.clinic_id);
    }

    // Doctor (forzado por Business si es doctor)
    if (filtros.doctor_id) {
      condiciones.push(`c.doctor_id = $${idx++}`);
      values.push(filtros.doctor_id);
    }

    // paciente
    if (filtros.paciente_id) {
      condiciones.push(`c.paciente_id = $${idx++}`);
      values.push(filtros.paciente_id);
    }

    // Persona (paciente o doctor)
    if (filtros.persona) {
      condiciones.push(`
        (
          pp.nombres ILIKE $${idx}
          OR pp.apellido_paterno ILIKE $${idx}
          OR pp.apellido_materno ILIKE $${idx}
          OR pd.nombres ILIKE $${idx}
          OR pd.apellido_paterno ILIKE $${idx}
          OR pd.apellido_materno ILIKE $${idx}
        )
      `);
      values.push(`%${filtros.persona}%`);
      idx++;
    }

    // Estado
    if (filtros.estado) {
      condiciones.push(`c.estado = $${idx++}`);
      values.push(filtros.estado);
    }

    // Detalles
    if (filtros.detalles) {
      condiciones.push(`c.detalles ILIKE $${idx++}`);
      values.push(`%${filtros.detalles}%`);
    }

    // Fecha exacta
    if (filtros.fecha) {
      condiciones.push(`c.fecha = $${idx++}`);
      values.push(filtros.fecha);
    }

    // Rango de fechas
    if (filtros.fecha_desde) {
      condiciones.push(`c.fecha >= $${idx++}`);
      values.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      condiciones.push(`c.fecha <= $${idx++}`);
      values.push(filtros.fecha_hasta);
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    const query = `
      SELECT
        c.fecha,
        c.hora,
        c.estado,
        c.detalles,
        c.created_at,
        pp.nombres AS paciente_nombres,
        pp.apellido_paterno AS paciente_apellido_paterno,
        pd.nombres AS doctor_nombres,
        pd.apellido_paterno AS doctor_apellido_paterno
      FROM citas c
      INNER JOIN pacientes pa ON pa.id = c.paciente_id
      INNER JOIN personas pp ON pp.id = pa.persona_id
      INNER JOIN usuarios u ON u.id = c.doctor_id
      INNER JOIN personas pd ON pd.id = u.persona_id
      ${where}
      ORDER BY c.fecha DESC, c.hora DESC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  /* =========================
   * ACTUALIZAR CITA
   * (uso interno del Business)
   * ========================= */
  async actualizar(id, data) {
    const campos = [];
    const values = [];
    let idx = 1;

    if (data.fecha) {
      campos.push(`fecha = $${idx++}`);
      values.push(data.fecha);
    }

    if (data.hora) {
      campos.push(`hora = $${idx++}`);
      values.push(data.hora);
    }

    if (data.estado) {
      campos.push(`estado = $${idx++}`);
      values.push(data.estado);
    }

    if (data.detalles !== undefined) {
      campos.push(`detalles = $${idx++}`);
      values.push(data.detalles);
    }

    if (campos.length === 0) return null;

    const query = `
      UPDATE citas
      SET ${campos.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }

  /**
   * Obtiene citas pendientes cuya fecha/hora + minutos < NOW()
   */
  async obtenerCitasExpiradas(minutos) {
    const query = `
      SELECT *
      FROM citas
      WHERE estado = 'pendiente'
        AND (fecha + hora::time + ($1 || ' minutes')::interval) < NOW()
    `;

    const { rows } = await db.query(query, [minutos]);
    return rows;
  }

}

module.exports = CitasPersistence;
