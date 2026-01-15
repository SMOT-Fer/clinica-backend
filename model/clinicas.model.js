module.exports = {
  table: 'clinicas',

  fields: {
    id: 'uuid',
    nombre: 'text',
    ruc: 'text',
    direccion: 'text',
    telefono: 'text',
    plan: 'enum',
    activa: 'boolean',
    created_at: 'timestamp'
  }
};
