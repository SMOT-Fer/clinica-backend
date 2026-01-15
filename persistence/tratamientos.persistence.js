const pool = require('../dbmanager/postgres');

/**
 * Crear tratamiento (por clínica)
 */
async function createTratamiento({
  clinic_id,
  nombre,
  descripcion,
  precio
}) {
  const query = `
    INSERT INTO tratamientos (
      clinic_id, nombre, descripcion, precio, activo
    )
    VALUES ($1,$2,$3,$4,true)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    clinic_id,
    nombre,
    descripcion,
    precio
  ]);

  return rows[0];
}
/**
 * Obtener tratamiento por ID (por clínica)
 */
async function findById(clinic_id, tratamiento_id) {
  const query = `
    SELECT *
    FROM tratamientos
    WHERE id = $1
      AND clinic_id = $2;
  `;

  const { rows } = await pool.query(query, [
    tratamiento_id,
    clinic_id
  ]);

  return rows[0] || null;
}
/**
 * Listar tratamientos por clínica
 */
async function findAllByClinic(clinic_id, { soloActivos = true } = {}) {
  let query = `
    SELECT *
    FROM tratamientos
    WHERE clinic_id = $1
  `;

  const values = [clinic_id];

  if (soloActivos) {
    query += ` AND activo = true`;
  }

  query += ` ORDER BY nombre ASC;`;

  const { rows } = await pool.query(query, values);
  return rows;
}
/**
 * Búsqueda de tratamientos
 * (nombre / descripción)
 */
async function searchTratamientos(clinic_id, {
  texto,
  activo
}) {
  const conditions = [`clinic_id = $1`];
  const values = [clinic_id];
  let idx = 2;

  if (activo !== undefined) {
    conditions.push(`activo = $${idx}`);
    values.push(activo);
    idx++;
  }

  if (texto) {
    conditions.push(`
      (
        nombre ILIKE $${idx}
        OR descripcion ILIKE $${idx}
      )
    `);
    values.push(`%${texto}%`);
    idx++;
  }

  const query = `
    SELECT *
    FROM tratamientos
    WHERE ${conditions.join(' AND ')}
    ORDER BY nombre ASC;
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}
/**
 * Actualizar tratamiento
 */
async function updateTratamiento(clinic_id, tratamiento_id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }

  values.push(tratamiento_id, clinic_id);

  const query = `
    UPDATE tratamientos
    SET ${fields.join(', ')}
    WHERE id = $${idx}
      AND clinic_id = $${idx + 1}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
}
/**
 * Soft delete de tratamiento
 */
async function disableTratamiento(clinic_id, tratamiento_id) {
  const query = `
    UPDATE tratamientos
    SET activo = false
    WHERE id = $1
      AND clinic_id = $2;
  `;

  await pool.query(query, [tratamiento_id, clinic_id]);
}
module.exports = {
  createTratamiento,
  findById,
  findAllByClinic,
  searchTratamientos,
  updateTratamiento,
  disableTratamiento
};
