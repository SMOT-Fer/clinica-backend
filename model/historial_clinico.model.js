module.exports = {
  table: 'historial_clinico',

  fields: {
    id: 'uuid',
    clinic_id: 'uuid',
    paciente_id: 'uuid',
    cita_id: 'uuid',
    observaciones: 'text',
    diagnostico: 'text',
    created_at: 'timestamp'
  }
};
