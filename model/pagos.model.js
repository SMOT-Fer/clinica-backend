/**
 * Model: Pago
 * Representa la tabla public.pagos
 * Modelo de datos puro (DAO-ready)
 */
class Pago {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.paciente_id = data.paciente_id ?? null;
    this.cita_id = data.cita_id ?? null;
    this.monto = data.monto ?? null;
    this.metodo = data.metodo ?? null;
    this.estado = data.estado ?? 'pendiente';
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
      paciente_id: this.paciente_id,
      cita_id: this.cita_id,
      monto: this.monto,
      metodo: this.metodo,
      estado: this.estado,
      fecha: this.fecha
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new Pago(row);
  }
}

module.exports = Pago;
