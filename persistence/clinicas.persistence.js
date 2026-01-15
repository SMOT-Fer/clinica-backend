const pool = require('../dbmanager/postgres');

/**
 * Crear clínica
 */
async function createClinica({
  nombre,
  ruc,
  direccion,
  telefono,
  plan = 'free'
}) {
  const query = `
    INSERT INTO clinicas (
      nombre, ruc, direccion, telefono, plan, activa
    )
    VALUES ($1,$2,$3,$4,$5,true)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    nombre,
    ruc,
    direccion,
    telefono,
    plan
  ]);

  return rows[0];
}
/**
 * Obtener clínica por ID
 */
async function findById(clinic_id) {
  const query = `
    SELECT *
    FROM clinicas
    WHERE id = $1;
  `;

  const { rows } = await pool.query(query, [clinic_id]);
  return rows[0] || null;
}
/**
 * Listar todas las clínicas
 */
async function findAll() {
  const query = `
    SELECT *
    FROM clinicas
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query);
  return rows;
}
/**
 * Búsqueda avanzada de clínicas
 */
async function searchClinicas({
  texto,
  plan,
  activa
}) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (texto) {
    conditions.push(`
      (
        nombre ILIKE $${idx}
        OR ruc ILIKE $${idx}
        OR direccion ILIKE $${idx}
        OR telefono ILIKE $${idx}
      )
    `);
    values.push(`%${texto}%`);
    idx++;
  }

  if (plan) {
    conditions.push(`plan = $${idx}`);
    values.push(plan);
    idx++;
  }

  if (activa !== undefined) {
    conditions.push(`activa = $${idx}`);
    values.push(activa);
    idx++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const query = `
    SELECT *
    FROM clinicas
    ${whereClause}
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}
/**
 * Actualizar datos de clínica
 */
async function updateClinica(clinic_id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }

  values.push(clinic_id);

  const query = `
    UPDATE clinicas
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
}
/**
 * Activar / desactivar clínica
 */
async function setClinicaActiva(clinic_id, activa) {
  const query = `
    UPDATE clinicas
    SET activa = $1
    WHERE id = $2;
  `;

  await pool.query(query, [activa, clinic_id]);
}
module.exports = {
  createClinica,
  findById,
  findAll,
  searchClinicas,
  updateClinica,
  setClinicaActiva
};
