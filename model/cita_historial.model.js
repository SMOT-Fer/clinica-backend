module.exports = {
  table: 'cita_historial',

  fields: {
    id: 'uuid',
    cita_id: 'uuid',
    fecha_anterior: 'date',
    hora_anterior: 'time',
    fecha_nueva: 'date',
    hora_nueva: 'time',
    usuario_id: 'uuid',
    motivo: 'text',
    created_at: 'timestamp'
  }
};
