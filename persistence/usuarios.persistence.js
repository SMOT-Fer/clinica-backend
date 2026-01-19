const db = require('../dbmanager/postgres');

class UsuariosPersistence {

  /* =========================
   * 1. CREAR USUARIO
   * ========================= */
  async crear(data) {
    const query = `
      INSERT INTO usuarios (
        clinic_id,
        persona_id,
        email,
        password_hash,
        rol,
        activo,
        created_at,
        last_seen,
        online
      ) VALUES ($1, $2, $3, $4, $5, true, now(), null, false)
      RETURNING *
    `;

    const values = [
      data.clinic_id,
      data.persona_id,
      data.email,
      data.password_hash,
      data.rol
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /* =========================
   * 2. OBTENER USUARIO POR ID
   * ========================= */
  async obtenerPorId(id) {
    const query = `
      SELECT
        u.id,
        u.email,
        u.rol,
        u.activo,
        u.online,
        u.created_at,
        u.last_seen,
        u.online,
        p.dni,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno
      FROM usuarios u
      INNER JOIN personas p ON p.id = u.persona_id
      WHERE id = $1
      ORDER BY p.apellido_paterno ASC, p.nombres ASC
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  /* =========================
   * 3. OBTENER USUARIO POR EMAIL (LOGIN)
   * ========================= */
  async obtenerPorEmail(email) {
    const query = `
      SELECT *
      FROM usuarios
      WHERE email = $1
    `;

    const { rows } = await db.query(query, [email]);
    return rows[0] || null;
  }

  /* =========================
   * 4. BUSCAR / LISTAR USUARIOS
   * ========================= */
  async buscar(filtros = {}) {
    const condiciones = [];
    const values = [];
    let idx = 1;

    if (filtros.clinic_id) {
      condiciones.push(`u.clinic_id = $${idx++}`);
      values.push(filtros.clinic_id);
    }

    if (filtros.rol) {
      condiciones.push(`u.rol = $${idx++}`);
      values.push(filtros.rol);
    }

    if (typeof filtros.activo === 'boolean') {
      condiciones.push(`u.activo = $${idx++}`);
      values.push(filtros.activo);
    }

    if (filtros.texto) {
      condiciones.push(`
        (
          u.email ILIKE $${idx}
          OR p.nombres ILIKE $${idx}
          OR p.apellido_paterno ILIKE $${idx}
          OR p.apellido_materno ILIKE $${idx}
          OR p.dni ILIKE $${idx}
        )
      `);
      values.push(`%${filtros.texto}%`);
      idx++;
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    const query = `
      SELECT
        u.id,
        u.email,
        u.rol,
        u.activo,
        u.online,
        u.created_at,
        u.last_seen,
        u.online,
        p.dni,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno
      FROM usuarios u
      INNER JOIN personas p ON p.id = u.persona_id
      ${where}
      ORDER BY p.apellido_paterno ASC, p.nombres ASC
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  /* =========================
   * 5. ACTUALIZAR DATOS ADMINISTRATIVOS
   * ========================= */
  async actualizar(id, data) {
    const campos = [];
    const values = [];
    let idx = 1;

    if (data.email) {
      campos.push(`email = $${idx++}`);
      values.push(data.email);
    }

    if (data.rol) {
      campos.push(`rol = $${idx++}`);
      values.push(data.rol);
    }

    if (typeof data.activo === 'boolean') {
      campos.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (campos.length === 0) return null;

    const query = `
      UPDATE usuarios
      SET ${campos.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }

  /* =========================
   * 6. ACTUALIZAR PASSWORD
   * ========================= */
  async actualizarPassword(id, password_hash) {
    const query = `
      UPDATE usuarios
      SET password_hash = $1
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, [password_hash, id]);
    return rows[0] || null;
  }

  /* =========================
   * 7. ACTUALIZAR PRESENCIA
   * ========================= */
  async actualizarPresencia(id, online) {
    const query = `
      UPDATE usuarios
      SET
        online = $1,
        last_seen = now()
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, [online, id]);
    return rows[0] || null;
  }
}

module.exports = UsuariosPersistence;
