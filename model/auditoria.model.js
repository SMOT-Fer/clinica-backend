module.exports = {
  table: 'auditoria',

  fields: {
    id: 'uuid',
    clinic_id: 'uuid',
    usuario_id: 'uuid',
    accion: 'text',
    tabla: 'text',
    registro_id: 'uuid',
    descripcion: 'text',
    fecha: 'timestamp'
  }
};
