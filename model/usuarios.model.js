module.exports = {
  table: 'usuarios',

  fields: {
    id: 'uuid',
    clinic_id: 'uuid',
    persona_id: 'uuid',
    email: 'text',
    password_hash: 'text',
    rol: 'enum',
    activo: 'boolean',
    created_at: 'timestamp'
  }
};
