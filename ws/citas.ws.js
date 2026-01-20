// ws/citas.ws.js

const CitasBusiness = require('../business/citas.busines');

module.exports = (socket, io) => {

  /* =========================
   * CREAR CITA
   * ========================= */
  socket.on('cita:crear', async (data, cb) => {
    try {
      const cita = await CitasBusiness.crearCita(
        socket.session,
        data
      );

      cb({ ok: true, data: cita });

      // Broadcast opcional por clínica
      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'citas:actualizadas'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * CONFIRMAR CITA
   * ========================= */
  socket.on('cita:confirmar', async ({ cita_id }, cb) => {
    try {
      const cita = await CitasBusiness.confirmarCita(
        socket.session,
        cita_id
      );

      cb({ ok: true, data: cita });
      io.emit('cita:actualizada', cita);

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * REASIGNAR CITA
   * ========================= */
  socket.on('cita:reasignar', async ({ cita_id, doctor_id }, cb) => {
    try {
      const cita = await CitasBusiness.reasignarCita(
        socket.session,
        cita_id,
        doctor_id ?? null
      );

      cb({ ok: true, data: cita });
      io.emit('cita:actualizada', cita);

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * PASAR A POR PAGAR
   * ========================= */
  socket.on('cita:pasar_por_pagar', async ({ cita_id, datosClinicos }, cb) => {
    try {
      const cita = await CitasBusiness.pasarAPorPagar(
        socket.session,
        cita_id,
        datosClinicos
      );

      cb({ ok: true, data: cita });
      io.emit('cita:actualizada', cita);

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * FINALIZAR CITA (PAGO)
   * ========================= */
  socket.on('cita:finalizar', async ({ cita_id, metodoPago }, cb) => {
    try {
      const cita = await CitasBusiness.finalizarCita(
        socket.session,
        cita_id,
        metodoPago
      );

      cb({ ok: true, data: cita });
      io.emit('cita:actualizada', cita);

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * CANCELAR CITA
   * ========================= */
  socket.on('cita:cancelar', async ({ cita_id }, cb) => {
    try {
      const cita = await CitasBusiness.cancelarCita(
        socket.session,
        cita_id
      );

      cb({ ok: true, data: cita });
      io.emit('cita:actualizada', cita);

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER CITA
   * ========================= */
  socket.on('cita:obtener', async ({ cita_id }, cb) => {
    try {
      const cita = await CitasBusiness.obtenerCita(
        socket.session,
        cita_id
      );

      cb({ ok: true, data: cita });

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * LISTAR CITAS
   * ========================= */
  socket.on('citas:listar', async (filtros, cb) => {
    try {
      const citas = await CitasBusiness.listarCitas(
        socket.session,
        filtros
      );

      cb({ ok: true, data: citas });

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
