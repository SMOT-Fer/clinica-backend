const db = require('../dbmanager/postgres');

class CitaHistorialPersistence {

  /* =========================
   * 1. CREAR HISTORIAL (automático)
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO cita_historial (
        cita_id,
        fecha_anterior,
        hora_anterior,
        fecha_nueva,
        hora_nueva,
        usuario_id,
        motivo,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      RETURNING *
    `;

    const values = [
      data.cita_id,
      data.fecha_anterior,
      data.hora_anterior,
      data.fecha_nueva,
      data.hora_nueva,
      data.usuario_id,
      data.motivo ?? null
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 2. OBTENER HISTORIAL POR ID
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT
        ch.*,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno
      FROM cita_historial ch
      LEFT JOIN usuarios u ON u.id = ch.usuario_id
      LEFT JOIN personas p ON p.id = u.persona_id
      WHERE ch.id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. LISTAR HISTORIAL DE UNA CITA
   * ========================= */
  async listarPorCita(cita_id) {
    const query = `
      SELECT
        ch.*,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno
      FROM cita_historial ch
      LEFT JOIN usuarios u ON u.id = ch.usuario_id
      LEFT JOIN personas p ON p.id = u.persona_id
      WHERE ch.cita_id = $1
      ORDER BY ch.created_at ASC
    `;

    const { rows } = await db.query(query, [cita_id]);
    return rows;
  }
}

module.exports = CitaHistorialPersistence;
