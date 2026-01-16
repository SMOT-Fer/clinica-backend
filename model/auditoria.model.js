/**
 * Model: Auditoria
 * Representa la tabla public.auditoria
 * Modelo de datos puro (DAO-ready)
 */
class Auditoria {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.usuario_id = data.usuario_id ?? null;
    this.accion = data.accion ?? null;
    this.tabla = data.tabla ?? null;
    this.registro_id = data.registro_id ?? null;
    this.descripcion = data.descripcion ?? null;
    this.fecha = data.fecha ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      clinic_id: this.clinic_id,
      usuario_id: this.usuario_id,
      accion: this.accion,
      tabla: this.tabla,
      registro_id: this.registro_id,
      descripcion: this.descripcion,
      fecha: this.fecha
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new Auditoria(row);
  }
}

module.exports = Auditoria;
