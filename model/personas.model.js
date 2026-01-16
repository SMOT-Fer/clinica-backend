/**
 * Model: Persona
 * Representa la tabla public.personas
 * Modelo de datos puro (DAO-ready)
 */
class Persona {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.dni = data.dni ?? null;
    this.nombres = data.nombres ?? null;
    this.apellido_paterno = data.apellido_paterno ?? null;
    this.apellido_materno = data.apellido_materno ?? null;
    this.telefono = data.telefono ?? null;
    this.fecha_nacimiento = data.fecha_nacimiento ?? null;
    this.sexo = data.sexo ?? null;
    this.origen_datos = data.origen_datos ?? 'api';
    this.created_at = data.created_at ?? null;
    this.ultima_actualizacion = data.ultima_actualizacion ?? null;
  }

  /**
   * Devuelve solo columnas reales de la BD
   * Uso exclusivo por DAOs
   */
  toDB() {
    return {
      id: this.id,
      dni: this.dni,
      nombres: this.nombres,
      apellido_paterno: this.apellido_paterno,
      apellido_materno: this.apellido_materno,
      telefono: this.telefono,
      fecha_nacimiento: this.fecha_nacimiento,
      sexo: this.sexo,
      origen_datos: this.origen_datos,
      created_at: this.created_at,
      ultima_actualizacion: this.ultima_actualizacion
    };
  }

  /**
   * Construye el modelo desde una fila de PostgreSQL
   */
  static fromDB(row) {
    return new Persona(row);
  }
}

module.exports = Persona;
