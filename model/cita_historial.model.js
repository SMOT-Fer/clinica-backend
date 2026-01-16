/**
 * Model: CitaHistorial
 * Representa la tabla public.cita_historial
 * Modelo de datos puro (DAO-ready)
 */
class CitaHistorial {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.cita_id = data.cita_id ?? null;
    this.fecha_anterior = data.fecha_anterior ?? null;
    this.hora_anterior = data.hora_anterior ?? null;
    this.fecha_nueva = data.fecha_nueva ?? null;
    this.hora_nueva = data.hora_nueva ?? null;
    this.usuario_id = data.usuario_id ?? null;
    this.motivo = data.motivo ?? null;
    this.created_at = data.created_at ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      cita_id: this.cita_id,
      fecha_anterior: this.fecha_anterior,
      hora_anterior: this.hora_anterior,
      fecha_nueva: this.fecha_nueva,
      hora_nueva: this.hora_nueva,
      usuario_id: this.usuario_id,
      motivo: this.motivo,
      created_at: this.created_at
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new CitaHistorial(row);
  }
}

module.exports = CitaHistorial;
