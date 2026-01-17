const db = require('../dbmanager/postgres');

class HistorialClinicoPersistence {

  /* =========================
   * 1. CREAR HISTORIAL CLÍNICO
   * (una vez por cita)
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO historial_clinico (
        clinic_id,
        paciente_id,
        cita_id,
        diagnostico,
        observaciones,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, now())
      RETURNING *
    `;

    const values = [
      data.clinic_id,
      data.paciente_id,
      data.cita_id,
      data.diagnostico,
      data.observaciones ?? null
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 2. OBTENER HISTORIAL POR ID
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT *
      FROM historial_clinico
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. OBTENER HISTORIAL POR CITA
   * (1 a 1)
   * ========================= */
  async obtenerPorCita(cita_id) {
    const query = `
      SELECT *
      FROM historial_clinico
      WHERE cita_id = $1
    `;

    const { rows } = await db.query(query, [cita_id]);
    return rows[0] || null;
  }

  /* =========================
   * 4. LISTAR HISTORIAL DE UN PACIENTE
   * ========================= */
  async listarPorPaciente(paciente_id) {
    const query = `
      SELECT *
      FROM historial_clinico
      WHERE paciente_id = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query, [paciente_id]);
    return rows;
  }
}

module.exports = HistorialClinicoPersistence;
