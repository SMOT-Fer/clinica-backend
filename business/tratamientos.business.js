// business/tratamientos.business.js

const TratamientosPersistence = require('../persistence/tratamientos.persistence');
const AuditoriaBusiness = require('./auditoria.business');

const tratamientosPersistence = new TratamientosPersistence();

/* =========================
 * VALIDACIONES INTERNAS
 * ========================= */

function requireAdmin(session) {
  if (!session || session.rol !== 'admin') {
    throw new Error('Acción permitida solo para admin');
  }
}

/* =========================
 * CREAR TRATAMIENTO
 * ========================= */
async function crearTratamiento(session, data) {
  requireAdmin(session);

  const tratamiento = await tratamientosPersistence.crear({
    clinic_id: session.clinic_id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    precio: data.precio
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'tratamientos',
    registro_id: tratamiento.id,
    descripcion: `Tratamiento creado (${tratamiento.nombre})`
  });

  return tratamiento;
}

/* =========================
 * LISTAR / BUSCAR TRATAMIENTOS
 * ========================= */
async function listarTratamientos(session, filtros = {}) {
  return tratamientosPersistence.buscar({
    ...filtros,
    clinic_id: session.clinic_id
  });
}

/* =========================
 * OBTENER TRATAMIENTO
 * ========================= */
async function obtenerTratamiento(session, id) {
  const tratamiento = await tratamientosPersistence.obtenerPorId(id);

  if (!tratamiento || tratamiento.clinic_id !== session.clinic_id) {
    throw new Error('Tratamiento no encontrado');
  }

  return tratamiento;
}

/* =========================
 * ACTUALIZAR TRATAMIENTO
 * ========================= */
async function actualizarTratamiento(session, id, data) {
  requireAdmin(session);

  const tratamiento = await tratamientosPersistence.obtenerPorId(id);
  if (!tratamiento || tratamiento.clinic_id !== session.clinic_id) {
    throw new Error('Tratamiento no encontrado');
  }

  const actualizado = await tratamientosPersistence.actualizar(id, data);
  if (!actualizado) return tratamiento;

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'tratamientos',
    registro_id: id,
    descripcion: `Tratamiento actualizado (${actualizado.nombre})`
  });

  return actualizado;
}

/* =========================
 * DESACTIVAR / ACTIVAR TRATAMIENTO
 * ========================= */
async function desactivarTratamiento(session, id) {
  requireAdmin(session);

  const tratamiento = await tratamientosPersistence.actualizar(id, {
    activo: false
  });

  if (!tratamiento) {
    throw new Error('Tratamiento no encontrado');
  }

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'tratamientos',
    registro_id: id,
    descripcion: `Tratamiento desactivado (${tratamiento.nombre})`
  });

  return tratamiento;
}

async function activarTratamiento(session, id) {
  requireAdmin(session);

  const tratamiento = await tratamientosPersistence.actualizar(id, {
    activo: true
  });

  if (!tratamiento) {
    throw new Error('Tratamiento no encontrado');
  }

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'tratamientos',
    registro_id: id,
    descripcion: `Tratamiento activado (${tratamiento.nombre})`
  });

  return tratamiento;
}

module.exports = {
  crearTratamiento,
  listarTratamientos,
  obtenerTratamiento,
  actualizarTratamiento,
  desactivarTratamiento,
  activarTratamiento
};
