const db = require('../dbmanager/postgres');

class CitaTratamientosPersistence {

  /* =========================
   * CREAR (automático desde Business)
   * ========================= */
  async crear({ cita_id, tratamiento_id, precio_aplicado }) {
    const query = `
      INSERT INTO cita_tratamientos (
        cita_id,
        tratamiento_id,
        precio_aplicado
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      cita_id,
      tratamiento_id,
      precio_aplicado
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * ELIMINAR UN TRATAMIENTO DE UNA CITA
   * ========================= */
  async eliminar({ cita_id, tratamiento_id }) {
    const query = `
      DELETE FROM cita_tratamientos
      WHERE cita_id = $1
        AND tratamiento_id = $2
    `;

    await db.query(query, [cita_id, tratamiento_id]);
    return true;
  }

  /* =========================
   * ELIMINAR TODOS LOS TRATAMIENTOS DE UNA CITA
   * (útil para edición completa)
   * ========================= */
  async eliminarPorCita(cita_id) {
    const query = `
      DELETE FROM cita_tratamientos
      WHERE cita_id = $1
    `;

    await db.query(query, [cita_id]);
    return true;
  }

  /* =========================
   * LISTAR TRATAMIENTOS DE UNA CITA
   * (para mostrar en el frontend)
   * ========================= */
  async listarPorCita(cita_id) {
    const query = `
      SELECT
        ct.id,
        ct.tratamiento_id,
        ct.precio_aplicado,
        t.nombre
      FROM cita_tratamientos ct
      INNER JOIN tratamientos t ON t.id = ct.tratamiento_id
      WHERE ct.cita_id = $1
    `;

    const { rows } = await db.query(query, [cita_id]);
    return rows;
  }

  /* =========================
   * OBTENER TOTAL DE LA CITA
   * (base para pagos)
   * ========================= */
  async obtenerTotalPorCita(cita_id) {
    const query = `
      SELECT
        COALESCE(SUM(precio_aplicado), 0) AS total
      FROM cita_tratamientos
      WHERE cita_id = $1
    `;

    const { rows } = await db.query(query, [cita_id]);
    return Number(rows[0].total);
  }
}

module.exports = CitaTratamientosPersistence;
