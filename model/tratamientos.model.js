module.exports = {
  table: 'tratamientos',

  fields: {
    id: 'uuid',
    clinic_id: 'uuid',
    nombre: 'text',
    descripcion: 'text',
    precio: 'numeric',
    activo: 'boolean'
  }
};
