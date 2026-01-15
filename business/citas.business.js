const citasDao = require('../persistence/citas.persistence');
const citaTratamientosDao = require('../persistence/cita_tratamientos.persistence');
const pagosDao = require('../persistence/pagos.persistence');
const citaHistorialDao = require('../persistence/cita_historial.persistence');
const auditoriaDao = require('../persistence/auditoria.persistence');

/**
 * Crear cita completa:
 * - crea cita
 * - agrega tratamientos
 * - calcula total
 * - crea pago pendiente
 * - audita
 */
async function createCitaCompleta({
  clinic_id,
  paciente_id,
  doctor_id,
  fecha,
  hora,
  detalles,
  tratamientos,
  usuario_id
}) {
  if (!tratamientos || tratamientos.length === 0) {
    throw new Error('La cita debe tener al menos un tratamiento');
  }

  // 1) Crear cita
  const cita = await citasDao.createCita({
    clinic_id,
    paciente_id,
    doctor_id,
    fecha,
    hora,
    detalles
  });

  // 2) Agregar tratamientos y calcular total
  let total = 0;

  for (const t of tratamientos) {
    await citaTratamientosDao.addTratamientoToCita({
      cita_id: cita.id,
      tratamiento_id: t.tratamiento_id,
      precio_aplicado: t.precio_aplicado
    });

    total += Number(t.precio_aplicado);
  }

  // 3) Crear pago pendiente
  const pago = await pagosDao.createPago({
    clinic_id,
    paciente_id,
    cita_id: cita.id,
    monto: total
  });

  // 4) Auditoría
  await auditoriaDao.registrarAuditoria({
    clinic_id,
    usuario_id,
    accion: 'CREATE',
    tabla: 'citas',
    registro_id: cita.id,
    descripcion: `Cita creada con ${tratamientos.length} tratamientos`
  });

  return { cita, pago };
}

/**
 * Reprogramar cita
 */
async function reprogramarCita({
  cita_id,
  nueva_fecha,
  nueva_hora,
  usuario_id,
  motivo
}) {
  const cita = await citasDao.findById(cita_id);
  if (!cita) throw new Error('La cita no existe');
  if (cita.estado === 'cancelada') {
    throw new Error('No se puede reprogramar una cita cancelada');
  }

  await citaHistorialDao.registrarCambioCita({
    cita_id,
    fecha_anterior: cita.fecha,
    hora_anterior: cita.hora,
    fecha_nueva: nueva_fecha,
    hora_nueva: nueva_hora,
    usuario_id,
    motivo
  });

  const citaActualizada = await citasDao.updateCita({
    id: cita_id,
    fecha: nueva_fecha,
    hora: nueva_hora
  });

  await auditoriaDao.registrarAuditoria({
    clinic_id: cita.clinic_id,
    usuario_id,
    accion: 'UPDATE',
    tabla: 'citas',
    registro_id: cita.id,
    descripcion: 'Reprogramación de cita'
  });

  return citaActualizada;
}

/**
 * Pagar cita
 */
async function pagarCita({
  pago_id,
  metodo,
  usuario_id
}) {
  const pago = await pagosDao.findById(pago_id);
  if (!pago) throw new Error('El pago no existe');
  if (pago.estado !== 'pendiente') {
    throw new Error('El pago no está pendiente');
  }

  const pagoPagado = await pagosDao.marcarPagoComoPagado(
    pago.clinic_id,
    pago.id,
    metodo
  );

  await auditoriaDao.registrarAuditoria({
    clinic_id: pago.clinic_id,
    usuario_id,
    accion: 'UPDATE',
    tabla: 'pagos',
    registro_id: pago.id,
    descripcion: `Pago realizado con método ${metodo}`
  });

  return pagoPagado;
}

/**
 * Cancelar cita
 */
async function cancelarCita({
  cita_id,
  usuario_id,
  motivo
}) {
  const cita = await citasDao.findById(cita_id);
  if (!cita) throw new Error('La cita no existe');
  if (cita.estado === 'cancelada') {
    throw new Error('La cita ya está cancelada');
  }

  await citasDao.cancelCita(cita_id);

  const pagos = await pagosDao.searchPagos({
    clinic_id: cita.clinic_id,
    cita_id
  });

  if (pagos.length && pagos[0].estado === 'pendiente') {
    await pagosDao.cancelPago(
      cita.clinic_id,
      pagos[0].id
    );
  }

  await auditoriaDao.registrarAuditoria({
    clinic_id: cita.clinic_id,
    usuario_id,
    accion: 'CANCEL',
    tabla: 'citas',
    registro_id: cita.id,
    descripcion: motivo || 'Cancelación de cita'
  });

  return true;
}

module.exports = {
  createCitaCompleta,
  reprogramarCita,
  pagarCita,
  cancelarCita
};
