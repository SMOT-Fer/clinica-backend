// business/citas.business.js

const CitasPersistence = require('../persistence/citas.persistence');

const PacientesBusiness = require('./pacientes.business');
const UsuariosBusiness = require('./usuarios.business');
const HistorialClinicoBusiness = require('./historial_clinico.business');
const PagosBusiness = require('./pagos.business');
const AuditoriaBusiness = require('./auditoria.business');

const citasPersistence = new CitasPersistence();

/* =====================================================
 * VALIDACIONES INTERNAS
 * ===================================================== */

function validarRol(rol, permitidos) {
  if (!permitidos.includes(rol)) {
    throw new Error('No autorizado para esta acción');
  }
}

function validarDoctorAsignado(session, cita) {
  if (session.rol === 'doctor' && cita.doctor_id !== session.usuario_id) {
    throw new Error('No autorizado: no es el doctor asignado');
  }
}

/* =====================================================
 * CREAR CITA
 * ===================================================== */
async function crearCita(session, data) {
  // Resolver paciente (flujo DNI → persona → paciente)
  const paciente = await PacientesBusiness.crearPaciente(session, {
    dni: data.dni
  });

  let estado = 'pendiente';
  let doctor_id = data.doctor_id ?? null;

  if (!doctor_id) {
    estado = 'reasignar';
  }

  const cita = await citasPersistence.crear({
    clinic_id: session.clinic_id,
    paciente_id: paciente.id,
    doctor_id,
    fecha: data.fecha,
    hora: data.hora,
    estado,
    detalles: data.detalles
  });

  // Crear pago automáticamente
  await PagosBusiness.crearPagoPorCita({
    clinic_id: session.clinic_id,
    paciente_id: paciente.id,
    cita_id: cita.id
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'citas',
    registro_id: cita.id,
    descripcion: `Cita creada (estado: ${estado})`
  });

  return cita;
}

/* =====================================================
 * CONFIRMAR CITA
 * ===================================================== */
async function confirmarCita(session, cita_id) {
  validarRol(session.rol, ['doctor', 'admin']);

  const cita = await citasPersistence.obtenerPorId(cita_id);
  if (!cita) throw new Error('Cita no encontrada');

  validarDoctorAsignado(session, cita);

  if (cita.estado !== 'pendiente') {
    throw new Error('Solo se puede confirmar una cita pendiente');
  }

  const actualizada = await citasPersistence.actualizar(cita_id, {
    estado: 'confirmada'
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'citas',
    registro_id: cita_id,
    descripcion: 'Cita confirmada'
  });

  return actualizada;
}

/* =====================================================
 * REASIGNAR CITA
 * ===================================================== */
async function reasignarCita(session, cita_id, nuevoDoctorId = null) {
  validarRol(session.rol, ['doctor', 'admin']);

  const cita = await citasPersistence.obtenerPorId(cita_id);
  if (!cita) throw new Error('Cita no encontrada');

  validarDoctorAsignado(session, cita);

  const estado = nuevoDoctorId ? 'pendiente' : 'reasignar';

  const actualizada = await citasPersistence.actualizar(cita_id, {
    doctor_id: nuevoDoctorId,
    estado
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'citas',
    registro_id: cita_id,
    descripcion: `Cita reasignada (estado: ${estado})`
  });

  return actualizada;
}

/* =====================================================
 * PASAR A POR_PAGAR (FIN DE ATENCIÓN)
 * ===================================================== */
async function pasarAPorPagar(session, cita_id, datosClinicos) {
  validarRol(session.rol, ['doctor', 'admin']);

  const cita = await citasPersistence.obtenerPorId(cita_id);
  if (!cita) throw new Error('Cita no encontrada');

  validarDoctorAsignado(session, cita);

  if (!['confirmada', 'pendiente'].includes(cita.estado)) {
    throw new Error('La cita no puede pasar a por pagar');
  }

  // Crear historial clínico (1 por cita)
  await HistorialClinicoBusiness.crearHistorial(session, {
    clinic_id: session.clinic_id,
    paciente_id: cita.paciente_id,
    cita_id,
    diagnostico: datosClinicos.diagnostico,
    observaciones: datosClinicos.observaciones
  });

  const actualizada = await citasPersistence.actualizar(cita_id, {
    estado: 'por_pagar'
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'citas',
    registro_id: cita_id,
    descripcion: 'Cita marcada como por pagar'
  });

  return actualizada;
}

/* =====================================================
 * FINALIZAR CITA (PAGO)
 * ===================================================== */
async function finalizarCita(session, cita_id, metodoPago) {
  validarRol(session.rol, ['admin', 'staff']);

  const cita = await citasPersistence.obtenerPorId(cita_id);
  if (!cita) throw new Error('Cita no encontrada');

  if (cita.estado !== 'por_pagar') {
    throw new Error('La cita no está lista para finalizar');
  }

  // Marcar pago como pagado
  await PagosBusiness.marcarComoPagado(session, cita_id, metodoPago);

  const actualizada = await citasPersistence.actualizar(cita_id, {
    estado: 'finalizada'
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'citas',
    registro_id: cita_id,
    descripcion: 'Cita finalizada y pagada'
  });

  return actualizada;
}

/* =====================================================
 * CANCELAR CITA (MANUAL)
 * ===================================================== */
async function cancelarCita(session, cita_id) {
  const cita = await citasPersistence.obtenerPorId(cita_id);
  if (!cita) throw new Error('Cita no encontrada');

  // Todos pueden cancelar
  await PagosBusiness.cancelarPago(session, cita_id);

  const actualizada = await citasPersistence.actualizar(cita_id, {
    estado: 'cancelada'
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'citas',
    registro_id: cita_id,
    descripcion: 'Cita cancelada manualmente'
  });

  return actualizada;
}

/* =====================================================
 * CANCELAR CITA POR TIMEOUT (JOB)
 * ===================================================== */
async function cancelarCitaPorTimeout(cita_id) {
  const cita = await citasPersistence.obtenerPorId(cita_id);
  if (!cita || cita.estado !== 'pendiente') return null;

  await PagosBusiness.cancelarPago(null, cita_id);

  const actualizada = await citasPersistence.actualizar(cita_id, {
    estado: 'cancelada'
  });

  await AuditoriaBusiness.registrar(null, {
    accion: 'ACTUALIZAR',
    tabla: 'citas',
    registro_id: cita_id,
    descripcion: 'Cita cancelada automáticamente por timeout'
  });

  return actualizada;
}

/* =====================================================
 * CONSULTAS
 * ===================================================== */
async function obtenerCita(session, cita_id) {
  return citasPersistence.obtenerPorId(cita_id);
}

async function listarCitas(session, filtros = {}) {
  const finalFiltros = {
    ...filtros,
    clinic_id: session.clinic_id
  };

  if (session.rol === 'doctor') {
    finalFiltros.doctor_id = session.usuario_id;
  }

  return citasPersistence.buscar(finalFiltros);
}

module.exports = {
  crearCita,
  confirmarCita,
  reasignarCita,
  pasarAPorPagar,
  finalizarCita,
  cancelarCita,
  cancelarCitaPorTimeout,
  obtenerCita,
  listarCitas
};
