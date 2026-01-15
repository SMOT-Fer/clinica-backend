const pool = require('../dbmanager/postgres');

/**
 * Crear pago
 */
async function createPago({
  clinic_id,
  paciente_id,
  cita_id,
  monto,
  metodo,
  estado = 'pendiente', client = pool
}) {
  const query = `
    INSERT INTO pagos (
      clinic_id, paciente_id, cita_id, monto, metodo, estado
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    clinic_id,
    paciente_id,
    cita_id,
    monto,
    metodo,
    estado
  ]);

  return rows[0];
}
/**
 * Obtener pago por ID (por clínica)
 */
async function findById(clinic_id, pago_id) {
  const query = `
    SELECT
      pg.*,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno
    FROM pagos pg
    JOIN pacientes pa ON pa.id = pg.paciente_id
    JOIN personas p ON p.id = pa.persona_id
    WHERE pg.id = $1
      AND pg.clinic_id = $2;
  `;

  const { rows } = await pool.query(query, [pago_id, clinic_id]);
  return rows[0] || null;
}
/**
 * Listar pagos por clínica
 */
async function findAllByClinic(clinic_id) {
  const query = `
    SELECT
      pg.id,
      pg.monto,
      pg.metodo,
      pg.estado,
      pg.fecha,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno
    FROM pagos pg
    JOIN pacientes pa ON pa.id = pg.paciente_id
    JOIN personas p ON p.id = pa.persona_id
    WHERE pg.clinic_id = $1
    ORDER BY pg.fecha DESC;
  `;

  const { rows } = await pool.query(query, [clinic_id]);
  return rows;
}
/**
 * Búsqueda avanzada de pagos
 * - texto (paciente)
 * - rango de fechas
 * - estado
 */
async function searchPagos(
  clinic_id,
  {
    texto,
    fecha_desde,
    fecha_hasta,
    estado
  }
) {
  const conditions = [`pg.clinic_id = $1`];
  const values = [clinic_id];
  let idx = 2;

  if (fecha_desde && fecha_hasta) {
    conditions.push(`pg.fecha BETWEEN $${idx} AND $${idx + 1}`);
    values.push(fecha_desde, fecha_hasta);
    idx += 2;
  }

  if (estado) {
    conditions.push(`pg.estado = $${idx}`);
    values.push(estado);
    idx++;
  }

  if (texto) {
    conditions.push(`
      (
        p.nombres ILIKE $${idx}
        OR p.apellido_paterno ILIKE $${idx}
        OR p.apellido_materno ILIKE $${idx}
      )
    `);
    values.push(`%${texto}%`);
    idx++;
  }

  const query = `
    SELECT
      pg.id,
      pg.monto,
      pg.metodo,
      pg.estado,
      pg.fecha,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno
    FROM pagos pg
    JOIN pacientes pa ON pa.id = pg.paciente_id
    JOIN personas p ON p.id = pa.persona_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY pg.fecha DESC;
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}
/**
 * Marcar pago como pagado
 * - estado → pagado
 * - metodo → método seleccionado
 * - fecha → NOW()
 * - monto NO se toca
 */
async function marcarPagoComoPagado(clinic_id, pago_id, metodo) {
  const query = `
    UPDATE pagos
    SET
      estado = 'pagado',
      metodo = $1,
      fecha = NOW()
    WHERE id = $2
      AND clinic_id = $3
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    metodo,
    pago_id,
    clinic_id
  ]);

  return rows[0];
}

/**
 * Cancelar pago
 * - estado → cancelado
 * - metodo → no_hubo
 * - fecha → NOW()
 */
async function cancelPago(clinic_id, pago_id, client = pool) {
  const query = `
    UPDATE pagos
    SET
      estado = 'cancelado',
      metodo = 'no_hubo',
      fecha = NOW()
    WHERE id = $1
      AND clinic_id = $2
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [pago_id, clinic_id]);
  return rows[0];
}
/**
 * Actualizar SOLO el método de pago
 * (ej: se equivocaron en efectivo / tarjeta)
 */
async function updateMetodoPago({ clinic_id, pago_id, metodo }) {
  const query = `
    UPDATE pagos
    SET
      metodo = $1,
      fecha = NOW()
    WHERE id = $2
      AND clinic_id = $3
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    metodo,
    pago_id,
    clinic_id
  ]);

  return rows[0];
}
module.exports = {
  updateMetodoPago,
  marcarPagoComoPagado,
  createPago,
  findById,
  findAllByClinic,
  searchPagos,
  cancelPago
};
