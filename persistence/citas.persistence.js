const pool = require('../dbmanager/postgres');

/**
 * Crear cita
 */
async function createCita({
  clinic_id,
  paciente_id,
  doctor_id,
  fecha,
  hora,
  estado = 'pendiente',
  detalles,
  client = pool
}) {
  const query = `
    INSERT INTO citas (
      clinic_id, paciente_id, doctor_id, fecha, hora, estado, detalles
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    clinic_id,
    paciente_id,
    doctor_id,
    fecha,
    hora,
    estado,
    detalles
  ]);

  return rows[0];
}
/**
 * Obtener cita por ID (por clínica)
 */
async function findById(clinic_id, cita_id) {
  const query = `
    SELECT
      c.*,
      p.nombres AS paciente_nombres,
      p.apellido_paterno AS paciente_apellido_paterno,
      p.apellido_materno AS paciente_apellido_materno,
      d.email AS doctor_email
    FROM citas c
    JOIN pacientes pa ON pa.id = c.paciente_id
    JOIN personas p ON p.id = pa.persona_id
    JOIN usuarios d ON d.id = c.doctor_id
    WHERE c.id = $1
      AND c.clinic_id = $2;
  `;

  const { rows } = await pool.query(query, [cita_id, clinic_id]);
  return rows[0] || null;
}
/**
 * Listar citas por clínica
 */
async function findAllByClinic(clinic_id) {
  const query = `
    SELECT
      c.*,
      p.nombres AS paciente_nombres,
      p.apellido_paterno AS paciente_apellido_paterno,
      p.apellido_materno AS paciente_apellido_materno
    FROM citas c
    JOIN pacientes pa ON pa.id = c.paciente_id
    JOIN personas p ON p.id = pa.persona_id
    WHERE c.clinic_id = $1
    ORDER BY c.fecha DESC, c.hora DESC;
  `;

  const { rows } = await pool.query(query, [clinic_id]);
  return rows;
}
/**
 * Búsqueda avanzada de citas
 * Soporta:
 * - texto (nombre, apellido, dni)
 * - rango de fechas
 * - doctor
 * - estado
 */
async function searchCitas(
  clinic_id,
  {
    texto,
    fecha_desde,
    fecha_hasta,
    doctor_id,
    estado
  }
) {
  const conditions = [`c.clinic_id = $1`];
  const values = [clinic_id];
  let idx = 2;

  if (fecha_desde && fecha_hasta) {
    conditions.push(`c.fecha BETWEEN $${idx} AND $${idx + 1}`);
    values.push(fecha_desde, fecha_hasta);
    idx += 2;
  }

  if (doctor_id) {
    conditions.push(`c.doctor_id = $${idx}`);
    values.push(doctor_id);
    idx++;
  }

  if (estado) {
    conditions.push(`c.estado = $${idx}`);
    values.push(estado);
    idx++;
  }

  if (texto) {
    conditions.push(`
      (
        p.nombres ILIKE $${idx}
        OR p.apellido_paterno ILIKE $${idx}
        OR p.apellido_materno ILIKE $${idx}
        OR p.dni ILIKE $${idx}
      )
    `);
    values.push(`%${texto}%`);
    idx++;
  }

  const query = `
    SELECT
      c.id,
      c.fecha,
      c.hora,
      c.estado,
      p.nombres AS paciente_nombres,
      p.apellido_paterno AS paciente_apellido_paterno,
      p.apellido_materno AS paciente_apellido_materno
    FROM citas c
    JOIN pacientes pa ON pa.id = c.paciente_id
    JOIN personas p ON p.id = pa.persona_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.fecha DESC, c.hora DESC;
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}
/**
 * Actualizar cita
 */
async function updateCita(clinic_id, cita_id, data, client = pool) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }

  values.push(cita_id, clinic_id);

  const query = `
    UPDATE citas
    SET ${fields.join(', ')}
    WHERE id = $${idx}
      AND clinic_id = $${idx + 1}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
}
/**
 * Cancelar cita (solo cambia estado)
 * El efecto en pagos / auditoría se verá en BUSINESS
 */
async function cancelCita(clinic_id, cita_id, client = pool) {
  const query = `
    UPDATE citas
    SET estado = 'cancelada'
    WHERE id = $1
      AND clinic_id = $2;
  `;

  await pool.query(query, [cita_id, clinic_id]);
}
module.exports = {
  createCita,
  findById,
  findAllByClinic,
  searchCitas,
  updateCita,
  cancelCita
};
