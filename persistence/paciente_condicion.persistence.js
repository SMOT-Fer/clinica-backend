const db = require('../dbmanager/postgres');

class PacienteCondicionesPersistence {

  /* =========================
   * 1. ASIGNAR CONDICIÓN A PACIENTE
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO paciente_condiciones (
        paciente_id,
        condicion_medica_id,
        descripcion_libre,
        created_at
      ) VALUES ($1, $2, $3, now())
      RETURNING *
    `;

    const values = [
      data.paciente_id,
      data.condicion_medica_id,
      data.descripcion_libre ?? null
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 2. LISTAR CONDICIONES DE UN PACIENTE
   * ========================= */
  async listarPorPaciente(paciente_id) {
    const query = `
      SELECT
        pc.id,
        pc.descripcion_libre,
        pc.created_at,
        cm.nombre AS condicion_nombre
      FROM paciente_condiciones pc
      INNER JOIN condiciones_medicas cm
        ON cm.id = pc.condicion_medica_id
      WHERE pc.paciente_id = $1
      ORDER BY pc.created_at DESC
    `;

    const { rows } = await db.query(query, [paciente_id]);
    return rows;
  }

  /* =========================
   * 3. ELIMINAR CONDICIÓN DE PACIENTE
   * ========================= */
  async eliminar(id) {
    const query = `
      DELETE FROM paciente_condiciones
      WHERE id = $1
    `;

    await db.query(query, [id]);
    return true;
  }
}

module.exports = PacienteCondicionesPersistence;
