const pool = require('../dbmanager/postgres');

/**
 * Crear persona
 */
async function createPersona({
  dni,
  nombres,
  apellido_paterno,
  apellido_materno,
  telefono,
  fecha_nacimiento,
  sexo,
  origen_datos = 'manual'
}) {
  const query = `
    INSERT INTO personas (
      dni,
      nombres,
      apellido_paterno,
      apellido_materno,
      telefono,
      fecha_nacimiento,
      sexo,
      origen_datos
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    dni,
    nombres,
    apellido_paterno,
    apellido_materno,
    telefono,
    fecha_nacimiento,
    sexo,
    origen_datos
  ]);

  return rows[0];
}
/**
 * Obtener persona por ID
 */
async function findById(persona_id) {
  const query = `
    SELECT *
    FROM personas
    WHERE id = $1;
  `;

  const { rows } = await pool.query(query, [persona_id]);
  return rows[0] || null;
}
/**
 * Buscar persona por DNI
 */
async function findByDni(dni) {
  const query = `
    SELECT *
    FROM personas
    WHERE dni = $1;
  `;

  const { rows } = await pool.query(query, [dni]);
  return rows[0] || null;
}
/**
 * Búsqueda flexible de personas
 * (DNI, nombres, apellidos)
 */
async function searchPersonas(texto) {
  const query = `
    SELECT *
    FROM personas
    WHERE
      dni ILIKE $1
      OR nombres ILIKE $1
      OR apellido_paterno ILIKE $1
      OR apellido_materno ILIKE $1
    ORDER BY nombres ASC;
  `;

  const { rows } = await pool.query(query, [`%${texto}%`]);
  return rows;
}
/**
 * Actualizar persona
 * (business decide qué campos se pueden modificar)
 */
async function updatePersona(persona_id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }

  values.push(persona_id);

  const query = `
    UPDATE personas
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
}
/**
 * Eliminar persona (delete físico)
 * Business valida que sea origen manual
 */
async function deletePersona(persona_id) {
  const query = `
    DELETE FROM personas
    WHERE id = $1;
  `;

  await pool.query(query, [persona_id]);
}
module.exports = {
  createPersona,
  findById,
  findByDni,
  searchPersonas,
  updatePersona,
  deletePersona
};
