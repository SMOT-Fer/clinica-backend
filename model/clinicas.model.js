/**
 * Model: Clinica
 * Representa la tabla public.clinicas
 * Modelo de datos puro (DAO-ready)
 */
class Clinica {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.nombre = data.nombre ?? null;
    this.ruc = data.ruc ?? null;
    this.direccion = data.direccion ?? null;
    this.telefono = data.telefono ?? null;
    this.plan = data.plan ?? 'free';
    this.activa = data.activa ?? true;
    this.created_at = data.created_at ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      nombre: this.nombre,
      ruc: this.ruc,
      direccion: this.direccion,
      telefono: this.telefono,
      plan: this.plan,
      activa: this.activa,
      created_at: this.created_at
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new Clinica(row);
  }
}

module.exports = Clinica;
