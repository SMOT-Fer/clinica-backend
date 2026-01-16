/**
 * Model: CondicionMedica
 * Representa la tabla public.condiciones_medicas
 * Modelo de datos puro (DAO-ready)
 */
class CondicionMedica {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.paciente_id = data.paciente_id ?? null;
    this.descripcion = data.descripcion ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      paciente_id: this.paciente_id,
      descripcion: this.descripcion
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new CondicionMedica(row);
  }
}

module.exports = CondicionMedica;
