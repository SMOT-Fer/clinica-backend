/**
 * Model: Paciente
 * Representa la tabla public.pacientes
 * Modelo de datos puro (DAO-ready)
 */
class Paciente {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.persona_id = data.persona_id ?? null;
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
      persona_id: this.persona_id,
      created_at: this.created_at
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new Paciente(row);
  }
}

module.exports = Paciente;
