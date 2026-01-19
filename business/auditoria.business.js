// business/auditoria.business.js

const AuditoriaPersistence = require('../persistence/auditoria.persistence');
const UsuariosPersistence = require('../persistence/usuarios.persistence');

const auditoriaPersistence = new AuditoriaPersistence();
const usuariosPersistence = new UsuariosPersistence();

/* =========================
 * REGISTRAR EVENTO
 * =========================
 * session:
 *  - puede ser null (acciones del sistema / superadmin global)
 */
async function registrar(session, data) {
  return auditoriaPersistence.crear({
    clinic_id: session?.clinic_id ?? null,
    usuario_id: session?.usuario_id ?? null,
    accion: data.accion,
    tabla: data.tabla,
    registro_id: data.registro_id ?? null,
    descripcion: data.descripcion ?? null
  });
}

/* =========================
 * LISTAR / BUSCAR AUDITORÍA
 * ========================= */
async function buscar(session, filtros = {}) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);

  if (!usuario) {
    throw new Error('Usuario inválido');
  }

  // 🔓 Superadmin: auditoría global
  if (usuario.rol === 'superadmin') {
    return auditoriaPersistence.buscar(filtros);
  }

  // 🔐 Admin: solo auditoría de su clínica
  if (usuario.rol === 'admin') {
    return auditoriaPersistence.buscar({
      ...filtros,
      clinic_id: usuario.clinic_id
    });
  }

  throw new Error('No autorizado para acceder a auditoría');
}

/* =========================
 * OBTENER DETALLE DE AUDITORÍA
 * ========================= */
async function obtener(session, auditoria_id) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);
  const registro = await auditoriaPersistence.obtenerPorId(auditoria_id);

  if (!registro) {
    throw new Error('Registro de auditoría no encontrado');
  }

  // Superadmin: acceso total
  if (usuario.rol === 'superadmin') {
    return registro;
  }

  // Admin: solo si pertenece a su clínica
  if (
    usuario.rol === 'admin' &&
    registro.clinic_id === usuario.clinic_id
  ) {
    return registro;
  }

  throw new Error('No autorizado para ver este registro');
}

module.exports = {
  registrar,
  buscar,
  obtener
};
