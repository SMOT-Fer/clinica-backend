const pool = require('../db');

/**
 * Registrar cambio de fecha/hora de una cita
 */
async function registrarCambioCita({
  cita_id,
  fecha_anterior,
  hora_anterior,
  fecha_nueva,
  hora_nueva,
  usuario_id,
  motivo
}) {
  const query = `
    INSERT INTO cita_historial (
      cita_id,
      fecha_anterior,
      hora_anterior,
      fecha_nueva,
      hora_nueva,
      usuario_id,
      motivo
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    cita_id,
    fecha_anterior,
    hora_anterior,
    fecha_nueva,
    hora_nueva,
    usuario_id,
    motivo || null
  ]);

  return rows[0];
}

/**
 * Listar historial completo de una cita
 */
async function listarHistorialPorCita(cita_id) {
  const query = `
    SELECT *
    FROM cita_historial
    WHERE cita_id = $1
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query, [cita_id]);
  return rows;
}

/**
 * Historial de cambios hechos por un usuario
 */
async function listarHistorialPorUsuario(usuario_id) {
  const query = `
    SELECT *
    FROM cita_historial
    WHERE usuario_id = $1
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query, [usuario_id]);
  return rows;
}

module.exports = {
  registrarCambioCita,
  listarHistorialPorCita,
  listarHistorialPorUsuario
};
