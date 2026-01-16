/**
 * Model: CitaTratamiento
 * Representa la tabla public.cita_tratamientos
 * Modelo de datos puro (DAO-ready)
 */
class CitaTratamiento {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.cita_id = data.cita_id ?? null;
    this.tratamiento_id = data.tratamiento_id ?? null;
    this.precio_aplicado = data.precio_aplicado ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      cita_id: this.cita_id,
      tratamiento_id: this.tratamiento_id,
      precio_aplicado: this.precio_aplicado
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new CitaTratamiento(row);
  }
}

module.exports = CitaTratamiento;
