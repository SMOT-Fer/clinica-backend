/**
 * Model: Tratamiento
 * Representa la tabla public.tratamientos
 * Modelo de datos puro (DAO-ready)
 */
class Tratamiento {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.nombre = data.nombre ?? null;
    this.descripcion = data.descripcion ?? null;
    this.precio = data.precio ?? null;
    this.activo = data.activo ?? true;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      clinic_id: this.clinic_id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: this.precio,
      activo: this.activo
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new Tratamiento(row);
  }
}

module.exports = Tratamiento;
