// business/pagos.business.js

const PagosPersistence = require('../persistence/pagos.persistence');
const CitaTratamientosPersistence = require('../persistence/cita_tratamientos.persistence');
const AuditoriaBusiness = require('./auditoria.business');

const pagosPersistence = new PagosPersistence();
const citaTratamientosPersistence = new CitaTratamientosPersistence();

/* =====================================================
 * CREAR PAGO (AUTOMÁTICO AL CREAR CITA)
 * ===================================================== */
async function crearPagoPorCita({ clinic_id, paciente_id, cita_id }) {
  const existente = await pagosPersistence.obtenerPorCita(cita_id);
  if (existente) return existente;

  const monto = await citaTratamientosPersistence.obtenerTotalPorCita(cita_id);

  const pago = await pagosPersistence.crear({
    clinic_id,
    paciente_id,
    cita_id,
    monto,
    estado: 'pendiente',
    metodo: null
  });

  await AuditoriaBusiness.registrar(null, {
    accion: 'CREAR',
    tabla: 'pagos',
    registro_id: pago.id,
    descripcion: `Pago creado automáticamente para cita ${cita_id}`
  });

  return pago;
}

/* =====================================================
 * SINCRONIZAR MONTO DESDE TRATAMIENTOS
 * (solo si la cita NO está en por_pagar)
 * ===================================================== */
async function sincronizarMontoDesdeTratamientos(cita_id, cita_estado) {
  if (cita_estado === 'por_pagar' || cita_estado === 'finalizada') {
    return null; // monto congelado
  }

  const pago = await pagosPersistence.obtenerPorCita(cita_id);
  if (!pago || pago.estado !== 'pendiente') return pago;

  const monto = await citaTratamientosPersistence.obtenerTotalPorCita(cita_id);
  return pagosPersistence.actualizar(pago.id, { monto });
}

/* =====================================================
 * AJUSTE MANUAL DEL MONTO
 * (solo cuando la cita está en por_pagar)
 * ===================================================== */
async function actualizarMontoManual(session, cita_id, monto) {
  if (!['admin', 'doctor'].includes(session.rol)) {
    throw new Error('No autorizado para modificar el monto del pago');
  }

  const pago = await pagosPersistence.obtenerPorCita(cita_id);
  if (!pago) throw new Error('Pago no encontrado');

  if (pago.estado !== 'pendiente') {
    throw new Error('No se puede modificar un pago que no está pendiente');
  }

  const actualizado = await pagosPersistence.actualizar(pago.id, { monto });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'pagos',
    registro_id: pago.id,
    descripcion: `Monto del pago ajustado manualmente a ${monto}`
  });

  return actualizado;
}

/* =====================================================
 * MARCAR COMO PAGADO
 * (al pasar la cita a finalizada)
 * ===================================================== */
async function marcarComoPagado(session, cita_id, metodo) {
  if (!['admin', 'staff'].includes(session.rol)) {
    throw new Error('No autorizado para confirmar el pago');
  }

  const pago = await pagosPersistence.obtenerPorCita(cita_id);
  if (!pago) throw new Error('Pago no encontrado');

  if (pago.estado !== 'pendiente') {
    throw new Error('El pago no puede marcarse como pagado');
  }

  const actualizado = await pagosPersistence.actualizar(pago.id, {
    estado: 'pagado',
    metodo
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'pagos',
    registro_id: pago.id,
    descripcion: `Pago confirmado (método: ${metodo})`
  });

  return actualizado;
}

/* =====================================================
 * CANCELAR PAGO
 * (al cancelar la cita)
 * ===================================================== */
async function cancelarPago(session, cita_id) {
  const pago = await pagosPersistence.obtenerPorCita(cita_id);
  if (!pago) return null;

  if (pago.estado === 'pagado') {
    throw new Error('No se puede cancelar un pago ya realizado');
  }

  const actualizado = await pagosPersistence.actualizar(pago.id, {
    estado: 'cancelado',
    metodo: 'no_hubo'
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'pagos',
    registro_id: pago.id,
    descripcion: 'Pago cancelado por cancelación de cita'
  });

  return actualizado;
}

/* =====================================================
 * CONSULTAS
 * ===================================================== */
async function obtenerPagoPorCita(cita_id) {
  return pagosPersistence.obtenerPorCita(cita_id);
}

async function listarPagos(session, filtros = {}) {
  if (!['admin', 'superadmin'].includes(session.rol)) {
    throw new Error('No autorizado para listar pagos');
  }

  return pagosPersistence.buscar({
    ...filtros,
    clinic_id: session.clinic_id
  });
}

module.exports = {
  crearPagoPorCita,
  sincronizarMontoDesdeTratamientos,
  actualizarMontoManual,
  marcarComoPagado,
  cancelarPago,
  obtenerPagoPorCita,
  listarPagos
};
