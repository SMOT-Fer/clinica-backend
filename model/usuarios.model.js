/**
 * Model: Usuario
 * Representa la tabla public.usuarios
 * Modelo de datos puro (sin lógica de negocio)
 */
class Usuario {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.persona_id = data.persona_id ?? null;
    this.email = data.email ?? null;
    this.password_hash = data.password_hash ?? null;
    this.rol = data.rol ?? null;
    this.activo = data.activo ?? true;
    this.last_seen = data.last_seen ?? null;
    this.online = data.online ?? false;
    this.created_at = data.created_at ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD.
   * El DAO decide qué campos usar en cada query.
   */
  toDB() {
    return {
      id: this.id,
      clinic_id: this.clinic_id,
      persona_id: this.persona_id,
      email: this.email,
      password_hash: this.password_hash,
      rol: this.rol,
      activo: this.activo,
      last_seen: this.last_seen,
      online: this.online,
      created_at: this.created_at
    };
  }

  /**
   * Helper útil cuando traes filas desde PostgreSQL
   */
  static fromDB(row) {
    return new Usuario(row);
  }
}

module.exports = Usuario;
