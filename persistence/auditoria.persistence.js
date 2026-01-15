const pool = require('../db');

/**
 * Registrar acción en auditoría
 */
async function registrarAuditoria({
  clinic_id,
  usuario_id,
  accion,
  tabla,
  registro_id,
  descripcion, client = pool
}) {
  const query = `
    INSERT INTO auditoria (
      clinic_id,
      usuario_id,
      accion,
      tabla,
      registro_id,
      descripcion
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    clinic_id,
    usuario_id,
    accion,
    tabla,
    registro_id,
    descripcion
  ]);

  return rows[0];
}

/**
 * Listar auditoría por clínica
 */
async function listarAuditoriaPorClinica(clinic_id) {
  const query = `
    SELECT *
    FROM auditoria
    WHERE clinic_id = $1
    ORDER BY fecha DESC;
  `;

  const { rows } = await pool.query(query, [clinic_id]);
  return rows;
}

/**
 * Auditoría por registro específico
 */
async function listarAuditoriaPorRegistro(tabla, registro_id) {
  const query = `
    SELECT *
    FROM auditoria
    WHERE tabla = $1
      AND registro_id = $2
    ORDER BY fecha DESC;
  `;

  const { rows } = await pool.query(query, [
    tabla,
    registro_id
  ]);

  return rows;
}
/**
 * Búsqueda avanzada de auditoría
 * Todos los filtros son opcionales (excepto clinic_id)
 */
async function buscarAuditoria({
  clinic_id,
  usuario_id,
  accion,
  tabla,
  descripcion,
  fecha_desde,
  fecha_hasta,
  texto_persona // dni, nombres, apellidos
}) {
  let params = [];
  let where = [];
  let joins = '';

  // Siempre por clínica
  params.push(clinic_id);
  where.push(`a.clinic_id = $${params.length}`);

  // Join con usuarios/personas SOLO si se necesita
  if (usuario_id || texto_persona) {
    joins += `
      JOIN usuarios u ON u.id = a.usuario_id
      JOIN personas p ON p.id = u.persona_id
    `;
  }

  if (usuario_id) {
    params.push(usuario_id);
    where.push(`a.usuario_id = $${params.length}`);
  }

  if (accion) {
    params.push(accion);
    where.push(`a.accion = $${params.length}`);
  }

  if (tabla) {
    params.push(tabla);
    where.push(`a.tabla = $${params.length}`);
  }

  if (descripcion) {
    params.push(`%${descripcion}%`);
    where.push(`a.descripcion ILIKE $${params.length}`);
  }

  if (texto_persona) {
    params.push(`%${texto_persona}%`);
    where.push(`
      (
        p.dni ILIKE $${params.length}
        OR p.nombres ILIKE $${params.length}
        OR p.apellido_paterno ILIKE $${params.length}
        OR p.apellido_materno ILIKE $${params.length}
      )
    `);
  }

  if (fecha_desde) {
    params.push(fecha_desde);
    where.push(`a.fecha >= $${params.length}`);
  }

  if (fecha_hasta) {
    params.push(fecha_hasta);
    where.push(`a.fecha <= $${params.length}`);
  }

  const query = `
    SELECT
      a.*,
      u.id AS usuario_id,
      p.dni,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno
    FROM auditoria a
    ${joins}
    WHERE ${where.join(' AND ')}
    ORDER BY a.fecha DESC;
  `;

  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = {
  registrarAuditoria,
  listarAuditoriaPorClinica,
  listarAuditoriaPorRegistro,
  buscarAuditoria
};
