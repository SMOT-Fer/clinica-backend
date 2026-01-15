module.exports = {
  table: 'citas',

  fields: {
    id: 'uuid',
    clinic_id: 'uuid',
    paciente_id: 'uuid',
    doctor_id: 'uuid',
    fecha: 'date',
    hora: 'time',
    estado: 'enum',
    detalles: 'text',
    created_at: 'timestamp'
  }
};
