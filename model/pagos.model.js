module.exports = {
  table: 'pagos',

  fields: {
    id: 'uuid',
    clinic_id: 'uuid',
    paciente_id: 'uuid',
    cita_id: 'uuid',
    monto: 'numeric',
    metodo: 'enum',
    estado: 'enum',
    fecha: 'timestamp'
  }
};
