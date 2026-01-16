const db = require('../dbmanager/postgres');
const UserSession = require('../model/user_sessions.model');

class UserSessionsDAO {

  constructor() {}

  // 1️⃣ Instanciar
  instantiate(row) {
    if (!row) return null;

    return new UserSession({
      id: row.id ?? null,
      usuario_id: row.usuario_id ?? null,
      clinic_id: row.clinic_id ?? null,
      socket_id: row.socket_id ?? null,
      connected_at: row.connected_at ?? null,
      last_ping: row.last_ping ?? null,
      activo: row.activo ?? true
    });
  }

  // 2️⃣ Crear sesión (socket connect)
  async insert(model) {
    const query = `
      INSERT INTO user_sessions (
        usuario_id,
        clinic_id,
        socket_id,
        activo
      ) VALUES ($1, $2, $3, true)
      RETURNING *
    `;

    const values = [
      model.usuario_id,
      model.clinic_id,
      model.socket_id
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Actualizar ping (heartbeat)
  async updatePingBySocket(socket_id) {
    const query = `
      UPDATE user_sessions
      SET last_ping = now()
      WHERE socket_id = $1
        AND activo = true
      RETURNING *
    `;

    const { rows } = await db.query(query, [socket_id]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Activar / desactivar sesión (disconnect)
  async setActivoBySocket(socket_id, activo) {
    const query = `
      UPDATE user_sessions
      SET activo = $1
      WHERE socket_id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, [activo, socket_id]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 5️⃣ Obtener sesión por socket
  async getBySocketId(socket_id) {
    const query = `
      SELECT *
      FROM user_sessions
      WHERE socket_id = $1
    `;

    const { rows } = await db.query(query, [socket_id]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 6️⃣ Buscar sesiones (presencia)
  async findByFilter(filter = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (filter.clinic_id) {
      conditions.push(`clinic_id = $${idx++}`);
      values.push(filter.clinic_id);
    }

    if (filter.usuario_id) {
      conditions.push(`usuario_id = $${idx++}`);
      values.push(filter.usuario_id);
    }

    if (typeof filter.activo === 'boolean') {
      conditions.push(`activo = $${idx++}`);
      values.push(filter.activo);
    }

    if (conditions.length === 0) {
      throw new Error('Debe especificar al menos un filtro para buscar sesiones');
    }

    const query = `
      SELECT *
      FROM user_sessions
      WHERE ${conditions.join(' AND ')}
      ORDER BY last_ping DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = UserSessionsDAO;
