const pool = require('../dbmanager/postgres');

/**
 * Crear usuario (por clínica)
 */
async function createUser({
  clinic_id,
  persona_id,
  email,
  password_hash,
  rol
}) {
  const query = `
    INSERT INTO usuarios (
      clinic_id, persona_id, email, password_hash, rol, activo
    )
    VALUES ($1, $2, $3, $4, $5, true)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    clinic_id,
    persona_id,
    email,
    password_hash,
    rol
  ]);

  return rows[0];
}
/**
 * Obtener usuario por ID (SIEMPRE por clínica)
 */
async function findById(clinic_id, user_id) {
  const query = `
    SELECT *
    FROM usuarios
    WHERE id = $1
      AND clinic_id = $2
      AND activo = true;
  `;

  const { rows } = await pool.query(query, [
    user_id,
    clinic_id
  ]);

  return rows[0] || null;
}
/**
 * Buscar usuario por email (login)
 */
async function findByEmail(clinic_id, email) {
  const query = `
    SELECT *
    FROM usuarios
    WHERE email = $1
      AND clinic_id = $2
      AND activo = true;
  `;

  const { rows } = await pool.query(query, [
    email,
    clinic_id
  ]);

  return rows[0] || null;
}
/**
 * Listar usuarios por clínica
 */
async function findAllByClinic(clinic_id) {
  const query = `
    SELECT *
    FROM usuarios
    WHERE clinic_id = $1
      AND activo = true
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query, [clinic_id]);
  return rows;
}
/**
 * Búsqueda avanzada de usuarios (JOIN personas)
 */
async function searchUsers(clinic_id, {
  texto,
  rol,
  activo = true
}) {
  const values = [clinic_id];
  let idx = 2;

  let conditions = `
    u.clinic_id = $1
  `;

  if (activo !== undefined) {
    conditions += ` AND u.activo = $${idx}`;
    values.push(activo);
    idx++;
  }

  if (rol) {
    conditions += ` AND u.rol = $${idx}`;
    values.push(rol);
    idx++;
  }

  if (texto) {
    conditions += `
      AND (
        p.nombres ILIKE $${idx}
        OR p.apellido_paterno ILIKE $${idx}
        OR p.apellido_materno ILIKE $${idx}
        OR p.dni ILIKE $${idx}
      )
    `;
    values.push(`%${texto}%`);
    idx++;
  }

  const query = `
    SELECT
      u.id,
      u.email,
      u.rol,
      u.activo,
      u.created_at,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno,
      p.dni
    FROM usuarios u
    JOIN personas p ON p.id = u.persona_id
    WHERE ${conditions}
    ORDER BY u.created_at DESC;
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}
/**
 * Actualizar usuario (por clínica)
 */
async function updateUser(clinic_id, user_id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }

  values.push(user_id, clinic_id);

  const query = `
    UPDATE usuarios
    SET ${fields.join(', ')}
    WHERE id = $${idx}
      AND clinic_id = $${idx + 1}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
}
/**
 * Soft delete de usuario
 */
async function disableUser(clinic_id, user_id) {
  const query = `
    UPDATE usuarios
    SET activo = false
    WHERE id = $1
      AND clinic_id = $2;
  `;

  await pool.query(query, [user_id, clinic_id]);
}
module.exports = {
  createUser,
  findById,
  findByEmail,
  findAllByClinic,
  searchUsers,
  updateUser,
  disableUser
};
