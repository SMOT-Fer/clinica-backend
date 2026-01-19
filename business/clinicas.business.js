// business/clinicas.business.js

const ClinicasPersistence = require('../persistence/clinicas.persistence');
const UsuariosPersistence = require('../persistence/usuarios.persistence');
const AuditoriaBusiness = require('./auditoria.business');

const clinicasPersistence = new ClinicasPersistence();
const usuariosPersistence = new UsuariosPersistence();

/* =========================
 * VALIDACIONES INTERNAS
 * ========================= */

function requireSuperadmin(usuario) {
  if (!usuario || usuario.rol !== 'superadmin') {
    throw new Error('Acción permitida solo para superadmin');
  }
}

function requireClinicaActiva(clinica) {
  if (!clinica || clinica.activa !== true) {
    throw new Error('La clínica está desactivada. Acceso bloqueado.');
  }
}

/* =========================
 * CREAR CLÍNICA
 * ========================= */
async function crearClinica(session, data) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);
  requireSuperadmin(usuario);

  const clinica = await clinicasPersistence.crear(data);

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'clinicas',
    registro_id: clinica.id,
    descripcion: `Clínica creada: ${clinica.nombre}`
  });

  return clinica;
}

/* =========================
 * LISTAR CLÍNICAS
 * ========================= */
async function listarClinicas(session, filtros = {}) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);

  if (usuario.rol === 'superadmin') {
    return clinicasPersistence.buscar(filtros);
  }

  if (usuario.rol === 'admin') {
    const clinica = await clinicasPersistence.obtenerPorId(usuario.clinic_id);
    requireClinicaActiva(clinica);
    return [clinica];
  }

  throw new Error('No autorizado para listar clínicas');
}

/* =========================
 * OBTENER CLÍNICA
 * ========================= */
async function obtenerClinica(session, clinica_id) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);
  const clinica = await clinicasPersistence.obtenerPorId(clinica_id);

  if (!clinica) {
    throw new Error('Clínica no encontrada');
  }

  if (usuario.rol === 'superadmin') {
    return clinica;
  }

  if (usuario.rol === 'admin' && usuario.clinic_id === clinica.id) {
    requireClinicaActiva(clinica);
    return clinica;
  }

  throw new Error('No autorizado para ver esta clínica');
}

/* =========================
 * ACTUALIZAR CLÍNICA
 * ========================= */
async function actualizarClinica(session, clinica_id, data) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);
  requireSuperadmin(usuario);

  if ('activa' in data) {
    throw new Error('Use activarClinica o desactivarClinica');
  }

  const clinica = await clinicasPersistence.obtenerPorId(clinica_id);
  if (!clinica) {
    throw new Error('Clínica no encontrada');
  }

  const actualizada = await clinicasPersistence.actualizar(clinica_id, data);

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'clinicas',
    registro_id: clinica_id,
    descripcion: `Clínica actualizada: ${actualizada.nombre}`
  });

  return actualizada;
}

/* =========================
 * DESACTIVAR CLÍNICA
 * ========================= */
async function desactivarClinica(session, clinica_id) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);
  requireSuperadmin(usuario);

  const clinica = await clinicasPersistence.obtenerPorId(clinica_id);
  if (!clinica) {
    throw new Error('Clínica no encontrada');
  }

  if (!clinica.activa) {
    return clinica;
  }

  const desactivada = await clinicasPersistence.actualizar(clinica_id, {
    activa: false
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'DESACTIVAR',
    tabla: 'clinicas',
    registro_id: clinica_id,
    descripcion: `Clínica desactivada: ${clinica.nombre}`
  });

  return desactivada;
}

/* =========================
 * ACTIVAR CLÍNICA
 * ========================= */
async function activarClinica(session, clinica_id) {
  const usuario = await usuariosPersistence.obtenerPorId(session.usuario_id);
  requireSuperadmin(usuario);

  const clinica = await clinicasPersistence.obtenerPorId(clinica_id);
  if (!clinica) {
    throw new Error('Clínica no encontrada');
  }

  if (clinica.activa) {
    return clinica;
  }

  const activada = await clinicasPersistence.actualizar(clinica_id, {
    activa: true
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTIVAR',
    tabla: 'clinicas',
    registro_id: clinica_id,
    descripcion: `Clínica activada: ${clinica.nombre}`
  });

  return activada;
}

module.exports = {
  crearClinica,
  listarClinicas,
  obtenerClinica,
  actualizarClinica,
  desactivarClinica,
  activarClinica
};
