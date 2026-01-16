/**
 * Model: HistorialClinico
 * Representa la tabla public.historial_clinico
 * Modelo de datos puro (DAO-ready)
 */
class HistorialClinico {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.paciente_id = data.paciente_id ?? null;
    this.cita_id = data.cita_id ?? null;
    this.observaciones = data.observaciones ?? null;
    this.diagnostico = data.diagnostico ?? null;
    this.created_at = data.created_at ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      clinic_id: this.clinic_id,
      paciente_id: this.paciente_id,
      cita_id: this.cita_id,
      observaciones: this.observaciones,
      diagnostico: this.diagnostico,
      created_at: this.created_at
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new HistorialClinico(row);
  }
}

module.exports = HistorialClinico;
