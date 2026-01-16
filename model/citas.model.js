/**
 * Model: Cita
 * Representa la tabla public.citas
 * Modelo de datos puro (DAO-ready)
 */
class Cita {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.clinic_id = data.clinic_id ?? null;
    this.paciente_id = data.paciente_id ?? null;
    this.doctor_id = data.doctor_id ?? null;
    this.fecha = data.fecha ?? null;
    this.hora = data.hora ?? null;
    this.estado = data.estado ?? 'pendiente';
    this.detalles = data.detalles ?? null;
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
      doctor_id: this.doctor_id,
      fecha: this.fecha,
      hora: this.hora,
      estado: this.estado,
      detalles: this.detalles,
      created_at: this.created_at
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new Cita(row);
  }
}

module.exports = Cita;
