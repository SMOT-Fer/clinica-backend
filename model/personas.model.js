module.exports = {
  table: 'personas',

  fields: {
    id: 'uuid',
    dni: 'text',
    nombres: 'text',
    apellido_paterno: 'text',
    apellido_materno: 'text',
    telefono: 'text',
    fecha_nacimiento: 'date',
    sexo: 'enum',
    created_at: 'timestamp',
    origen_datos: 'text',
    ultima_actualizacion: 'timestamp'
  }
};
