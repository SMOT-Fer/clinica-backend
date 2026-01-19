const db = require('../dbmanager/postgres');

class PacientesPersistence {

  /* =========================
   * CREAR PACIENTE
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO pacientes (
        clinic_id,
        persona_id,
        created_at
      ) VALUES ($1, $2, now())
      RETURNING *
    `;

    const values = [
      data.clinic_id,
      data.persona_id
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * OBTENER PACIENTE POR ID
   * (siempre con persona)
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT
        p.id          AS paciente_id,
        p.clinic_id,
        p.created_at,
        per.id        AS persona_id,
        per.dni,
        per.nombres,
        per.apellido_paterno,
        per.apellido_materno,
        per.fecha_nacimiento,
        per.sexo
      FROM pacientes p
      INNER JOIN personas per ON per.id = p.persona_id
      WHERE p.id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * BUSCAR / LISTAR PACIENTES
   * (clinic_id obligatorio)
   * ========================= */
  async buscar(filtros = {}) {
    if (!filtros.clinic_id) {
      throw new Error('clinic_id es obligatorio para buscar pacientes');
    }

    const condiciones = [];
    const values = [];
    let idx = 1;

    // Scope obligatorio
    condiciones.push(`p.clinic_id = $${idx++}`);
    values.push(filtros.clinic_id);

    // Buscador por persona
    if (filtros.texto) {
      condiciones.push(`
        (
          per.dni ILIKE $${idx}
          OR per.nombres ILIKE $${idx}
          OR per.apellido_paterno ILIKE $${idx}
          OR per.apellido_materno ILIKE $${idx}
        )
      `);
      values.push(`%${filtros.texto}%`);
      idx++;
    }

    const query = `
      SELECT
        p.id          AS paciente_id,
        p.created_at,
        per.id        AS persona_id,
        per.dni,
        per.nombres,
        per.apellido_paterno,
        per.apellido_materno,
        per.fecha_nacimiento,
        per.sexo
      FROM pacientes p
      INNER JOIN personas per ON per.id = p.persona_id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY per.apellido_paterno ASC, per.nombres ASC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }
}

module.exports = PacientesPersistence;
