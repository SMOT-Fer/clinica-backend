// business/usuarios.business.js

const UsuariosPersistence = require('../persistence/usuarios.persistence');
const UserSessionsPersistence = require('../persistence/user_sessions.persistence');
const PersonasBusiness = require('./personas.business');
const AuditoriaBusiness = require('./auditoria.business');
const { hashPassword, comparePassword } = require('../utils/hash.util');

const usuariosPersistence = new UsuariosPersistence();
const userSessionsPersistence = new UserSessionsPersistence();

/* =========================
 * VALIDACIONES INTERNAS
 * ========================= */

function esSuperadmin(u) {
  return u.rol === 'superadmin';
}

function esAdmin(u) {
  return u.rol === 'admin';
}

function validarMismaClinica(actor, objetivo) {
  if (actor.clinic_id !== objetivo.clinic_id) {
    throw new Error('No pertenece a la misma clínica');
  }
}

function validarRolCreacion(actor, rolNuevo) {
  if (esSuperadmin(actor)) return;

  if (esAdmin(actor)) {
    if (!['doctor', 'staff'].includes(rolNuevo)) {
      throw new Error('Admin solo puede crear doctor o staff');
    }
    return;
  }

  throw new Error('No autorizado para crear usuarios');
}

/* =========================
 * CREAR USUARIO
 * ========================= */
async function crearUsuario(session, data) {
  const actor = await usuariosPersistence.obtenerPorId(session.usuario_id);
  validarRolCreacion(actor, data.rol);

  const clinic_id = esSuperadmin(actor)
    ? data.clinic_id
    : actor.clinic_id;

  // 🔑 Persona resuelta exclusivamente por personas.business
  const persona = await PersonasBusiness.resolverPersonaPorDNI(
    session,
    data.dni
  );

  const password_hash = await hashPassword(data.password);

  const usuario = await usuariosPersistence.crear({
    clinic_id,
    persona_id: persona.id,
    email: data.email,
    password_hash,
    rol: data.rol
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'usuarios',
    registro_id: usuario.id,
    descripcion: `Usuario creado (${usuario.email}, rol: ${usuario.rol})`
  });

  return usuario;
}

/* =========================
 * LISTAR USUARIOS
 * ========================= */
async function listarUsuarios(session, filtros = {}) {
  const actor = await usuariosPersistence.obtenerPorId(session.usuario_id);

  if (esSuperadmin(actor)) {
    return usuariosPersistence.buscar(filtros);
  }

  if (['admin', 'doctor', 'staff'].includes(actor.rol)) {
    return usuariosPersistence.buscar({
      ...filtros,
      clinic_id: actor.clinic_id
    });
  }

  throw new Error('No autorizado');
}

/* =========================
 * OBTENER USUARIO
 * ========================= */
async function obtenerUsuario(session, usuario_id) {
  const actor = await usuariosPersistence.obtenerPorId(session.usuario_id);
  const objetivo = await usuariosPersistence.obtenerPorId(usuario_id);

  if (!objetivo) throw new Error('Usuario no encontrado');

  if (esSuperadmin(actor)) return objetivo;

  validarMismaClinica(actor, objetivo);
  return objetivo;
}

/* =========================
 * ACTUALIZAR USUARIO
 * ========================= */
async function actualizarUsuario(session, usuario_id, data) {
  const actor = await usuariosPersistence.obtenerPorId(session.usuario_id);
  const objetivo = await usuariosPersistence.obtenerPorId(usuario_id);

  if (!objetivo) throw new Error('Usuario no encontrado');

  if (esSuperadmin(actor)) {
    const actualizado = await usuariosPersistence.actualizar(usuario_id, data);

    await AuditoriaBusiness.registrar(session, {
      accion: 'ACTUALIZAR',
      tabla: 'usuarios',
      registro_id: usuario_id,
      descripcion: `Usuario actualizado (${actualizado.email})`
    });

    return actualizado;
  }

  if (esAdmin(actor)) {
    validarMismaClinica(actor, objetivo);

    if (objetivo.id === actor.id && data.rol) {
      throw new Error('No puedes cambiar tu propio rol');
    }

    if (data.rol === 'admin') {
      throw new Error('No puedes asignar rol admin');
    }

    const actualizado = await usuariosPersistence.actualizar(usuario_id, data);

    await AuditoriaBusiness.registrar(session, {
      accion: 'ACTUALIZAR',
      tabla: 'usuarios',
      registro_id: usuario_id,
      descripcion: `Usuario actualizado (${actualizado.email})`
    });

    return actualizado;
  }

  throw new Error('No autorizado');
}

/* =========================
 * DESACTIVAR / ACTIVAR USUARIO
 * ========================= */
async function desactivarUsuario(session, usuario_id) {
  const actor = await usuariosPersistence.obtenerPorId(session.usuario_id);
  const objetivo = await usuariosPersistence.obtenerPorId(usuario_id);

  if (!objetivo) throw new Error('Usuario no encontrado');

  if (!esSuperadmin(actor)) {
    validarMismaClinica(actor, objetivo);
  }

  await userSessionsPersistence.cerrarSesionesPorUsuario(usuario_id);

  const actualizado = await usuariosPersistence.actualizar(usuario_id, {
    activo: false
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'DESACTIVAR',
    tabla: 'usuarios',
    registro_id: usuario_id,
    descripcion: `Usuario desactivado (${actualizado.email})`
  });

  return actualizado;
}

async function activarUsuario(session, usuario_id) {
  const actor = await usuariosPersistence.obtenerPorId(session.usuario_id);
  const objetivo = await usuariosPersistence.obtenerPorId(usuario_id);

  if (!objetivo) throw new Error('Usuario no encontrado');

  if (!esSuperadmin(actor)) {
    validarMismaClinica(actor, objetivo);
  }

  const actualizado = await usuariosPersistence.actualizar(usuario_id, {
    activo: true
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTIVAR',
    tabla: 'usuarios',
    registro_id: usuario_id,
    descripcion: `Usuario activado (${actualizado.email})`
  });

  return actualizado;
}

/* =========================
 * PASSWORD
 * ========================= */
async function resetearPassword(session, usuario_id, nuevoPassword) {
  const actor = await usuariosPersistence.obtenerPorId(session.usuario_id);
  const objetivo = await usuariosPersistence.obtenerPorId(usuario_id);

  if (!objetivo) throw new Error('Usuario no encontrado');

  if (!esSuperadmin(actor)) {
    validarMismaClinica(actor, objetivo);
  }

  const hash = await hashPassword(nuevoPassword);
  await userSessionsPersistence.cerrarSesionesPorUsuario(usuario_id);

  await usuariosPersistence.actualizarPassword(usuario_id, hash);

  await AuditoriaBusiness.registrar(session, {
    accion: 'RESET_PASSWORD',
    tabla: 'usuarios',
    registro_id: usuario_id,
    descripcion: `Password reseteado (${objetivo.email})`
  });
}

async function cambiarMiPassword(session, passwordActual, nuevoPassword) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);

  const ok = await comparePassword(passwordActual, usuario.password_hash);
  if (!ok) throw new Error('Password actual incorrecto');

  const hash = await hashPassword(nuevoPassword);
  await userSessionsPersistence.cerrarSesionesPorUsuario(usuario.id);

  await usuariosPersistence.actualizarPassword(usuario.id, hash);

  await AuditoriaBusiness.registrar(session, {
    accion: 'CAMBIAR_PASSWORD',
    tabla: 'usuarios',
    registro_id: usuario.id,
    descripcion: `Usuario cambió su password`
  });
}

module.exports = {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  desactivarUsuario,
  activarUsuario,
  resetearPassword,
  cambiarMiPassword
};
