// business/historial_clinico.business.js

const HistorialClinicoPersistence = require('../persistence/historial_clinico.persistence');
const AuditoriaBusiness = require('./auditoria.business');

const historialClinicoPersistence = new HistorialClinicoPersistence();

/* =========================
 * VALIDACIONES INTERNAS
 * ========================= */

function validarRolCrear(rol) {
  if (!['doctor', 'admin'].includes(rol)) {
    throw new Error('No autorizado para registrar historial clínico');
  }
}

function validarRolLectura(rol) {
  if (!['admin', 'doctor', 'staff'].includes(rol)) {
    throw new Error('No autorizado para ver historial clínico');
  }
}

/* =========================
 * CREAR HISTORIAL CLÍNICO
 * (1 por cita, cuando se marca como atendida)
 * ========================= */
async function crearHistorial(session, data) {
  validarRolCrear(session.rol);

  // Evitar duplicado: una cita solo puede tener un historial
  const existente = await historialClinicoPersistence.obtenerPorCita(
    data.cita_id
  );

  if (existente) {
    throw new Error('La cita ya tiene un historial clínico registrado');
  }

  const historial = await historialClinicoPersistence.crear({
    clinic_id: session.clinic_id,
    paciente_id: data.paciente_id,
    cita_id: data.cita_id,
    diagnostico: data.diagnostico,
    observaciones: data.observaciones
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'historial_clinico',
    registro_id: historial.id,
    descripcion: `Historial clínico registrado para cita ${data.cita_id}`
  });

  return historial;
}

/* =========================
 * OBTENER HISTORIAL POR CITA
 * ========================= */
async function obtenerPorCita(session, cita_id) {
  validarRolLectura(session.rol);
  return historialClinicoPersistence.obtenerPorCita(cita_id);
}

/* =========================
 * LISTAR HISTORIAL DE UN PACIENTE
 * ========================= */
async function listarPorPaciente(session, paciente_id) {
  validarRolLectura(session.rol);
  return historialClinicoPersistence.listarPorPaciente(paciente_id);
}

/* =========================
 * OBTENER HISTORIAL POR ID
 * ========================= */
async function obtener(session, historial_id) {
  validarRolLectura(session.rol);
  return historialClinicoPersistence.obtenerPorId(historial_id);
}

module.exports = {
  crearHistorial,
  obtenerPorCita,
  listarPorPaciente,
  obtener
};
