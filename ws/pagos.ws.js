// ws/pagos.ws.js

const PagosBusiness = require('../business/pagos.business');

module.exports = (socket, io) => {

  /* =========================
   * OBTENER PAGO POR CITA
   * ========================= */
  socket.on('pago:obtener_por_cita', async ({ cita_id }, cb) => {
    try {
      const pago = await PagosBusiness.obtenerPagoPorCita(cita_id);
      cb({ ok: true, data: pago });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * LISTAR PAGOS (ADMIN / SUPERADMIN)
   * ========================= */
  socket.on('pagos:listar', async (filtros, cb) => {
    try {
      const pagos = await PagosBusiness.listarPagos(
        socket.session,
        filtros || {}
      );

      cb({ ok: true, data: pagos });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * AJUSTAR MONTO MANUAL
   * ========================= */
  socket.on('pago:actualizar_monto', async ({ cita_id, monto }, cb) => {
    try {
      const pago = await PagosBusiness.actualizarMontoManual(
        socket.session,
        cita_id,
        monto
      );

      cb({ ok: true, data: pago });
      io.emit('pago:actualizado', { cita_id });

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * MARCAR COMO PAGADO
   * ========================= */
  socket.on('pago:marcar_pagado', async ({ cita_id, metodo }, cb) => {
    try {
      const pago = await PagosBusiness.marcarComoPagado(
        socket.session,
        cita_id,
        metodo
      );

      cb({ ok: true, data: pago });

      // Avisos reactivos
      io.emit('pago:actualizado', { cita_id });
      io.emit('cita:actualizada', { cita_id });

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * CANCELAR PAGO
   * ========================= */
  socket.on('pago:cancelar', async ({ cita_id }, cb) => {
    try {
      const pago = await PagosBusiness.cancelarPago(
        socket.session,
        cita_id
      );

      cb({ ok: true, data: pago });
      io.emit('pago:actualizado', { cita_id });

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
