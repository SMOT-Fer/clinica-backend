// business/pacientes.business.js

const PacientesPersistence = require('../persistence/pacientes.persistence');
const PacienteCondicionPersistence = require('../persistence/paciente_condicion.persistence');

const PersonasBusiness = require('./personas.business');
const CondicionesMedicasBusiness = require('./condiciones_medicas.business');
const AuditoriaBusiness = require('./auditoria.business');

const pacientesPersistence = new PacientesPersistence();
const pacienteCondicionPersistence = new PacienteCondicionPersistence();

/* =========================
 * VALIDACIONES INTERNAS
 * ========================= */

function validarRolCrearEditar(rol) {
  if (!['admin', 'doctor', 'staff', 'superadmin'].includes(rol)) {
    throw new Error('No autorizado');
  }
}

function validarRolEliminar(rol) {
  if (!['admin', 'superadmin'].includes(rol)) {
    throw new Error('No autorizado para eliminar pacientes');
  }
}

/* =========================
 * CREAR PACIENTE
 * ========================= */
async function crearPaciente(session, data) {
  validarRolCrearEditar(session.rol);

  // Resolver persona (BD → API → manual)
  const persona = await PersonasBusiness.resolverPersonaPorDNI(
    session,
    data.dni
  );

  // Evitar duplicados: una persona solo una vez por clínica
  const existente = await pacientesPersistence.obtenerPorPersonaYClinica(
    persona.id,
    session.clinic_id
  );

  if (existente) {
    return existente;
  }

  const paciente = await pacientesPersistence.crear({
    clinic_id: session.clinic_id,
    persona_id: persona.id
  });

  // Condiciones médicas iniciales (opcional)
  if (Array.isArray(data.condiciones_medicas) && data.condiciones_medicas.length) {
    const ids = data.condiciones_medicas.map(c => c.condicion_medica_id);

    // 🔐 Validación centralizada del catálogo
    await CondicionesMedicasBusiness.validarCondiciones(ids);

    for (const c of data.condiciones_medicas) {
      await pacienteCondicionPersistence.crear({
        paciente_id: paciente.id,
        condicion_medica_id: c.condicion_medica_id,
        descripcion_libre: c.descripcion_libre
      });
    }
  }

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'pacientes',
    registro_id: paciente.id,
    descripcion: `Paciente creado (DNI: ${persona.dni})`
  });

  return paciente;
}

/* =========================
 * LISTAR PACIENTES
 * ========================= */
async function listarPacientes(session, filtros = {}) {
  return pacientesPersistence.buscar({
    ...filtros,
    clinic_id: session.clinic_id
  });
}

/* =========================
 * OBTENER PACIENTE
 * ========================= */
async function obtenerPaciente(session, paciente_id) {
  const paciente = await pacientesPersistence.obtenerPorId(paciente_id);

  if (!paciente) {
    throw new Error('Paciente no encontrado');
  }

  return paciente;
}

/* =========================
 * ACTUALIZAR PACIENTE
 * (delegado a PERSONA si es manual)
 * ========================= */
async function actualizarPaciente(session, paciente_id, data) {
  validarRolCrearEditar(session.rol);

  const paciente = await pacientesPersistence.obtenerPorId(paciente_id);
  if (!paciente) {
    throw new Error('Paciente no encontrado');
  }

  // 🔁 Delegación correcta (valida origen + audita)
  await PersonasBusiness.actualizarPersona(
    session,
    paciente.persona_id,
    data
  );

  // Contrato del endpoint: devolver paciente
  return pacientesPersistence.obtenerPorId(paciente_id);
}

/* =========================
 * ASIGNAR CONDICIÓN MÉDICA
 * ========================= */
async function asignarCondicion(session, paciente_id, condicion_medica_id, descripcion) {
  validarRolCrearEditar(session.rol);

  // 🔐 Validación vía business
  await CondicionesMedicasBusiness.validarCondiciones([condicion_medica_id]);

  return pacienteCondicionPersistence.crear({
    paciente_id,
    condicion_medica_id,
    descripcion_libre: descripcion
  });
}

/* =========================
 * QUITAR CONDICIÓN MÉDICA
 * ========================= */
async function quitarCondicion(session, paciente_condicion_id) {
  validarRolCrearEditar(session.rol);
  return pacienteCondicionPersistence.eliminar(paciente_condicion_id);
}

/* =========================
 * ELIMINAR PACIENTE (DELETE REAL)
 * ========================= */
async function eliminarPaciente(session, paciente_id) {
  validarRolEliminar(session.rol);

  // Eliminar condiciones asociadas
  const condiciones = await pacienteCondicionPersistence.listarPorPaciente(
    paciente_id
  );

  for (const c of condiciones) {
    await pacienteCondicionPersistence.eliminar(c.id);
  }

  await pacientesPersistence.eliminar(paciente_id);

  await AuditoriaBusiness.registrar(session, {
    accion: 'ELIMINAR',
    tabla: 'pacientes',
    registro_id: paciente_id,
    descripcion: 'Paciente eliminado de la clínica'
  });

  return true;
}

module.exports = {
  crearPaciente,
  listarPacientes,
  obtenerPaciente,
  actualizarPaciente,
  asignarCondicion,
  quitarCondicion,
  eliminarPaciente
};
