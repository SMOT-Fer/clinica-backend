const pool = require('../db');

/**
 * Crear condición médica
 */
async function createCondicionMedica({ paciente_id, descripcion }) {
  const query = `
    INSERT INTO condiciones_medicas (
      paciente_id,
      descripcion
    )
    VALUES ($1, $2)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    paciente_id,
    descripcion
  ]);

  return rows[0];
}

/**
 * Listar condiciones médicas por paciente
 */
async function listCondicionesByPaciente(paciente_id) {
  const query = `
    SELECT *
    FROM condiciones_medicas
    WHERE paciente_id = $1
    ORDER BY descripcion;
  `;

  const { rows } = await pool.query(query, [paciente_id]);
  return rows;
}

/**
 * Actualizar descripción de condición médica
 */
async function updateCondicionMedica({ id, descripcion }) {
  const query = `
    UPDATE condiciones_medicas
    SET descripcion = $1
    WHERE id = $2
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    descripcion,
    id
  ]);

  return rows[0];
}

module.exports = {
  createCondicionMedica,
  listCondicionesByPaciente,
  updateCondicionMedica
};
