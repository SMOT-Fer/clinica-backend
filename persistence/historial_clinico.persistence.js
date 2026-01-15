const pool = require('../db');

/**
 * Crear historial clínico
 */
async function createHistorialClinico({
  clinic_id,
  paciente_id,
  cita_id,
  observaciones,
  diagnostico
}) {
  const query = `
    INSERT INTO historial_clinico (
      clinic_id,
      paciente_id,
      cita_id,
      observaciones,
      diagnostico
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    clinic_id,
    paciente_id,
    cita_id,
    observaciones || null,
    diagnostico || null
  ]);

  return rows[0];
}

/**
 * Listar historial clínico por paciente
 */
async function listHistorialByPaciente(paciente_id) {
  const query = `
    SELECT *
    FROM historial_clinico
    WHERE paciente_id = $1
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query, [paciente_id]);
  return rows;
}

/**
 * Obtener historial clínico por cita
 */
async function getHistorialByCita(cita_id) {
  const query = `
    SELECT *
    FROM historial_clinico
    WHERE cita_id = $1;
  `;

  const { rows } = await pool.query(query, [cita_id]);
  return rows[0];
}
/**
 * Búsqueda avanzada de historial clínico
 */
async function buscarHistorialClinico({
  clinic_id,
  paciente_id,
  cita_id,
  observaciones,
  diagnostico,
  fecha_desde,
  fecha_hasta
}) {
  let params = [];
  let where = [];

  // Clínica obligatoria
  params.push(clinic_id);
  where.push(`clinic_id = $${params.length}`);

  if (paciente_id) {
    params.push(paciente_id);
    where.push(`paciente_id = $${params.length}`);
  }

  if (cita_id) {
    params.push(cita_id);
    where.push(`cita_id = $${params.length}`);
  }

  if (observaciones) {
    params.push(`%${observaciones}%`);
    where.push(`observaciones ILIKE $${params.length}`);
  }

  if (diagnostico) {
    params.push(`%${diagnostico}%`);
    where.push(`diagnostico ILIKE $${params.length}`);
  }

  if (fecha_desde) {
    params.push(fecha_desde);
    where.push(`created_at >= $${params.length}`);
  }

  if (fecha_hasta) {
    params.push(fecha_hasta);
    where.push(`created_at <= $${params.length}`);
  }

  const query = `
    SELECT *
    FROM historial_clinico
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = {
  createHistorialClinico,
  listHistorialByPaciente,
  getHistorialByCita,
  buscarHistorialClinico
};

