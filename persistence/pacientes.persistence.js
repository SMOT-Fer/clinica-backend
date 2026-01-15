const pool = require('../dbmanager/postgres');

/**
 * Crear paciente (vincula persona a clínica)
 */
async function createPaciente({ clinic_id, persona_id }) {
  const query = `
    INSERT INTO pacientes (clinic_id, persona_id)
    VALUES ($1, $2)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [clinic_id, persona_id]);
  return rows[0];
}
/**
 * Obtener paciente por ID (por clínica)
 */
async function findById(clinic_id, paciente_id) {
  const query = `
    SELECT pa.*, p.dni, p.nombres, p.apellido_paterno, p.apellido_materno, p.telefono
    FROM pacientes pa
    JOIN personas p ON p.id = pa.persona_id
    WHERE pa.id = $1
      AND pa.clinic_id = $2;
  `;

  const { rows } = await pool.query(query, [paciente_id, clinic_id]);
  return rows[0] || null;
}
/**
 * Listar pacientes por clínica
 */
async function findAllByClinic(clinic_id) {
  const query = `
    SELECT pa.*, p.dni, p.nombres, p.apellido_paterno, p.apellido_materno, p.telefono
    FROM pacientes pa
    JOIN personas p ON p.id = pa.persona_id
    WHERE pa.clinic_id = $1
    ORDER BY p.nombres ASC;
  `;

  const { rows } = await pool.query(query, [clinic_id]);
  return rows;
}
/**
 * Buscar pacientes por texto (DNI / nombres / apellidos)
 */
async function searchPacientes(clinic_id, texto) {
  const query = `
    SELECT pa.*, p.dni, p.nombres, p.apellido_paterno, p.apellido_materno, p.telefono
    FROM pacientes pa
    JOIN personas p ON p.id = pa.persona_id
    WHERE pa.clinic_id = $1
      AND (
        p.dni ILIKE $2
        OR p.nombres ILIKE $2
        OR p.apellido_paterno ILIKE $2
        OR p.apellido_materno ILIKE $2
      )
    ORDER BY p.nombres ASC;
  `;

  const { rows } = await pool.query(query, [clinic_id, `%${texto}%`]);
  return rows;
}
/**
 * Actualizar vínculo paciente (raro, pero se deja)
 */
async function updatePaciente(clinic_id, paciente_id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }

  values.push(paciente_id, clinic_id);

  const query = `
    UPDATE pacientes
    SET ${fields.join(', ')}
    WHERE id = $${idx}
      AND clinic_id = $${idx + 1}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
}
/**
 * Eliminar paciente de una clínica (delete físico del vínculo)
 */
async function deletePaciente(clinic_id, paciente_id) {
  const query = `
    DELETE FROM pacientes
    WHERE id = $1
      AND clinic_id = $2;
  `;

  await pool.query(query, [paciente_id, clinic_id]);
}
module.exports = {
  createPaciente,
  findById,
  findAllByClinic,
  searchPacientes,
  updatePaciente,
  deletePaciente
};
