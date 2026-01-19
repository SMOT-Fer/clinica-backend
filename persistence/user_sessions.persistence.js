const db = require('../dbmanager/postgres');

class UserSessionsPersistence {

  /* =========================
   * 1. CREAR SESIÓN
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO user_sessions (
        usuario_id,
        clinic_id,
        socket_id,
        connected_at,
        last_ping,
        activo
      ) VALUES ($1, $2, $3, now(), now(), true)
      RETURNING *
    `;

    const values = [
      data.usuario_id,
      data.clinic_id,
      data.socket_id
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 2. ACTUALIZAR PING (ACTIVIDAD)
   * ========================= */
  async actualizarPing(socket_id) {
    const query = `
      UPDATE user_sessions
      SET last_ping = now()
      WHERE socket_id = $1
        AND activo = true
      RETURNING *
    `;

    const { rows } = await db.query(query, [socket_id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. CERRAR SESIÓN
   * ========================= */
  async cerrarSesionPorSocket(socket_id) {
    const query = `
      UPDATE user_sessions
      SET activo = false
      WHERE socket_id = $1
        AND activo = true
      RETURNING *
    `;

    const { rows } = await db.query(query, [socket_id]);
    return rows[0] || null;
  }

  /* =========================
   * 4. CERRAR SESIÓN POR USUARIO
   * (forzado por admin / superadmin)
   * ========================= */
  async cerrarSesionesPorUsuario(usuario_id) {
    const query = `
      UPDATE user_sessions
      SET activo = false
      WHERE usuario_id = $1
        AND activo = true
      RETURNING *
    `;

    const { rows } = await db.query(query, [usuario_id]);
    return rows;
  }

  /* =========================
   * 5. BUSCAR SESIONES
   * ========================= */
  async buscar(filtros = {}) {
    const condiciones = [];
    const values = [];
    let idx = 1;

    if (filtros.clinic_id) {
      condiciones.push(`us.clinic_id = $${idx++}`);
      values.push(filtros.clinic_id);
    }

    if (filtros.usuario_id) {
      condiciones.push(`us.usuario_id = $${idx++}`);
      values.push(filtros.usuario_id);
    }

    if (typeof filtros.activo === 'boolean') {
      condiciones.push(`us.activo = $${idx++}`);
      values.push(filtros.activo);
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    const query = `
      SELECT
        us.id,
        us.usuario_id,
        us.clinic_id,
        us.socket_id,
        us.connected_at,
        us.last_ping,
        us.activo
      FROM user_sessions us
      ${where}
      ORDER BY us.last_ping DESC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }
}

module.exports = UserSessionsPersistence;
