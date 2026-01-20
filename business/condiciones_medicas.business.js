// business/condiciones_medicas.business.js

const CondicionesMedicasPersistence = require('../persistence/condiciones_medicas.persistence');
const AuditoriaBusiness = require('./auditoria.business');

const condicionesPersistence = new CondicionesMedicasPersistence();

/* =========================
 * VALIDACIONES INTERNAS
 * ========================= */

function requireSuperadmin(session) {
  if (!session || session.rol !== 'superadmin') {
    throw new Error('Acción permitida solo para superadmin');
  }
}

/* =========================
 * CREAR CONDICIÓN MÉDICA
 * ========================= */
async function crearCondicion(session, data) {
  requireSuperadmin(session);

  const condicion = await condicionesPersistence.crear({
    nombre: data.nombre,
    descripcion: data.descripcion
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'condiciones_medicas',
    registro_id: condicion.id,
    descripcion: `Condición médica creada (${condicion.nombre})`
  });

  return condicion;
}

/* =========================
 * LISTAR / BUSCAR CONDICIONES
 * (todos los roles)
 * ========================= */
async function listarCondiciones(session, filtros = {}) {
  // Todos los roles pueden acceder
  return condicionesPersistence.buscar(filtros);
}

/* =========================
 * OBTENER CONDICIÓN POR ID
 * ========================= */
async function obtenerCondicion(session, id) {
  return condicionesPersistence.obtenerPorId(id);
}

/* =========================
 * ACTUALIZAR CONDICIÓN
 * ========================= */
async function actualizarCondicion(session, id, data) {
  requireSuperadmin(session);

  const condicion = await condicionesPersistence.actualizar(id, data);
  if (!condicion) {
    throw new Error('Condición médica no encontrada');
  }

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'condiciones_medicas',
    registro_id: id,
    descripcion: `Condición médica actualizada (${condicion.nombre})`
  });

  return condicion;
}

/* =========================
 * ELIMINAR CONDICIÓN
 * ========================= */
async function eliminarCondicion(session, id) {
  requireSuperadmin(session);

  const condicion = await condicionesPersistence.eliminar(id);
  if (!condicion) {
    throw new Error('Condición médica no encontrada');
  }

  await AuditoriaBusiness.registrar(session, {
    accion: 'ELIMINAR',
    tabla: 'condiciones_medicas',
    registro_id: id,
    descripcion: `Condición médica eliminada (${condicion.nombre})`
  });

  return condicion;
}

/* =========================
 * VALIDAR CONDICIONES (uso interno)
 * ========================= */
async function validarCondiciones(ids = []) {
  for (const id of ids) {
    const existe = await condicionesPersistence.obtenerPorId(id);
    if (!existe) {
      throw new Error(`Condición médica inválida: ${id}`);
    }
  }
  return true;
}

module.exports = {
  crearCondicion,
  listarCondiciones,
  obtenerCondicion,
  actualizarCondicion,
  eliminarCondicion,
  validarCondiciones
};
