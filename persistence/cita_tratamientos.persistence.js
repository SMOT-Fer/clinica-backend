const pool = require('../dbmanager/postgres');

/**
 * Agregar tratamiento a una cita
 * Guarda el precio aplicado en el momento
 */
async function addTratamientoToCita({
  clinic_id,
  cita_id,
  tratamiento_id,
  precio_aplicado
  , client = pool
}) {
  const query = `
    INSERT INTO cita_tratamientos (
      cita_id, tratamiento_id, precio_aplicado
    )
    SELECT $1, $2, $3
    FROM citas
    WHERE id = $1
      AND clinic_id = $4
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    cita_id,
    tratamiento_id,
    precio_aplicado,
    clinic_id
  ]);

  return rows[0];
}
/**
 * Listar tratamientos de una cita
 */
async function findByCita(clinic_id, cita_id) {
  const query = `
    SELECT
      ct.id,
      ct.precio_aplicado,
      t.id AS tratamiento_id,
      t.nombre,
      t.descripcion
    FROM cita_tratamientos ct
    JOIN tratamientos t ON t.id = ct.tratamiento_id
    JOIN citas c ON c.id = ct.cita_id
    WHERE ct.cita_id = $1
      AND c.clinic_id = $2;
  `;

  const { rows } = await pool.query(query, [cita_id, clinic_id]);
  return rows;
}
/**
 * Actualizar precio aplicado de un tratamiento en la cita
 * (solo si aún no se ha cerrado el pago, se valida en business)
 */
async function updatePrecioAplicado(
  clinic_id,
  cita_tratamiento_id,
  precio_aplicado
) {
  const query = `
    UPDATE cita_tratamientos ct
    SET precio_aplicado = $1
    FROM citas c
    WHERE ct.id = $2
      AND ct.cita_id = c.id
      AND c.clinic_id = $3
    RETURNING ct.*;
  `;

  const { rows } = await pool.query(query, [
    precio_aplicado,
    cita_tratamiento_id,
    clinic_id
  ]);

  return rows[0];
}
/**
 * Quitar tratamiento de una cita
 */
async function removeTratamientoFromCita(
  clinic_id,
  cita_tratamiento_id, client = pool
) {
  const query = `
    DELETE FROM cita_tratamientos ct
    USING citas c
    WHERE ct.id = $1
      AND ct.cita_id = c.id
      AND c.clinic_id = $2;
  `;

  await pool.query(query, [cita_tratamiento_id, clinic_id]);
}
module.exports = {
  addTratamientoToCita,
  findByCita,
  updatePrecioAplicado,
  removeTratamientoFromCita
};
