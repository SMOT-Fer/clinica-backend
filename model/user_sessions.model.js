/**
 * Model: UserSessions
 * Representa la tabla public.user_sessions
 * Modelo de datos puro (sin lógica de negocio)
 */
class UserSessions {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.usuario_id = data.usuario_id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.socket_id = data.socket_id ?? null;
    this.connected_at = data.connected_at ?? null;
    this.last_ping = data.last_ping ?? null;
    this.activo = data.activo ?? true;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      usuario_id: this.usuario_id,
      clinic_id: this.clinic_id,
      socket_id: this.socket_id,
      connected_at: this.connected_at,
      last_ping: this.last_ping,
      activo: this.activo
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new UserSessions(row);
  }
}

module.exports = UserSessions;
