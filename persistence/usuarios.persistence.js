const db = require('../dbmanager/postgres');
const Usuario = require('../model/usuarios.model');

class UsuariosDAO {

  constructor(clinicId) {
    if (!clinicId) {
      throw new Error('clinic_id es obligatorio para UsuariosDAO');
    }
    this.clinicId = clinicId;
  }

  // 1️⃣ Instanciar
  instantiate(row) {
    if (!row) return null;

    return new Usuario({
      id: row.id ?? null,
      clinic_id: row.clinic_id ?? null,
      persona_id: row.persona_id ?? null,
      email: row.email ?? null,
      password_hash: row.password_hash ?? null,
      rol: row.rol ?? null,
      activo: row.activo ?? true,
      last_seen: row.last_seen ?? null,
      online: row.online ?? false,
      created_at: row.created_at ?? null
    });
  }

  // 2️⃣ Crear usuario
  async insert(model) {
    const query = `
      INSERT INTO usuarios (
        clinic_id,
        persona_id,
        email,
        password_hash,
        rol,
        activo,
        online
      ) VALUES ($1, $2, $3, $4, $5, true, false)
      RETURNING *
    `;

    const values = [
      this.clinicId,
      model.persona_id,
      model.email,
      model.password_hash,
      model.rol
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update administrativo
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar usuario');
    }

    const query = `
      UPDATE usuarios
      SET
        email = $1,
        rol = $2,
        activo = $3
      WHERE id = $4
        AND clinic_id = $5
      RETURNING *
    `;

    const values = [
      model.email,
      model.rol,
      model.activo,
      model.id,
      this.clinicId
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Cambiar contraseña
  async updatePassword(id, password_hash) {
    const query = `
      UPDATE usuarios
      SET password_hash = $1
      WHERE id = $2
        AND clinic_id = $3
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      password_hash,
      id,
      this.clinicId
    ]);

    if (rows.length === 0) return null;
    return this.instantiate(rows[0]);
  }

  // 5️⃣ Activar / desactivar usuario
  async setActivo(id, activo) {
    const query = `
      UPDATE usuarios
      SET activo = $1
      WHERE id = $2
        AND clinic_id = $3
      RETURNING *
    `;

    const { rows } = await db.query(query, [activo, id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 6️⃣ Actualizar estado online
  async updateOnlineStatus(id, online) {
    const query = `
      UPDATE usuarios
      SET
        online = $1,
        last_seen = CASE
          WHEN $1 = false THEN now()
          ELSE last_seen
        END
      WHERE id = $2
        AND clinic_id = $3
      RETURNING *
    `;

    const { rows } = await db.query(query, [online, id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 7️⃣ Obtener usuario por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM usuarios
      WHERE id = $1
        AND clinic_id = $2
    `;

    const { rows } = await db.query(query, [id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 8️⃣ Obtener usuario por email (LOGIN)
  async getByEmail(email) {
    const query = `
      SELECT *
      FROM usuarios
      WHERE email = $1
        AND clinic_id = $2
        AND activo = true
    `;

    const { rows } = await db.query(query, [email, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 9️⃣ Buscar usuarios
  async findByFilter(filter = {}) {
    const conditions = ['u.clinic_id = $1'];
    const values = [this.clinicId];
    let idx = 2;

    if (filter.rol) {
      conditions.push(`u.rol = $${idx++}`);
      values.push(filter.rol);
    }

    if (typeof filter.activo === 'boolean') {
      conditions.push(`u.activo = $${idx++}`);
      values.push(filter.activo);
    }

    if (filter.persona_text && filter.persona_text.trim() !== '') {
      const text = `%${filter.persona_text.trim()}%`;

      conditions.push(`
        (
          p.dni ILIKE $${idx}
          OR p.nombres ILIKE $${idx}
          OR p.apellido_paterno ILIKE $${idx}
          OR p.apellido_materno ILIKE $${idx}
        )
      `);

      values.push(text);
      idx++;
    }

    const query = `
      SELECT u.*
      FROM usuarios u
      INNER JOIN personas p ON p.id = u.persona_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_at DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }

  // SOLO para login (NO multi-tenant todavía)
  static async getByEmailGlobal(email) {
    const query = `
      SELECT *
      FROM usuarios
      WHERE email = $1
        AND activo = true
    `;

    const { rows } = await db.query(query, [email]);
    if (rows.length === 0) return null;

    return rows[0]; // row crudo (incluye clinic_id)
  }

}

module.exports = UsuariosDAO;
