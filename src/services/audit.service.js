const pool = require('../db');

async function logAction({
  clinic_id,
  usuario_id,
  accion,
  tabla,
  registro_id = null,
  descripcion = null
}) {
  await pool.query(
    `insert into auditoria 
     (clinic_id, usuario_id, accion, tabla, registro_id, descripcion)
     values ($1, $2, $3, $4, $5, $6)`,
    [clinic_id, usuario_id, accion, tabla, registro_id, descripcion]
  );
}

module.exports = { logAction };
