// ws/historial_clinico.ws.js

const HistorialClinicoBusiness = require('../business/historial_clinico.business');

module.exports = (socket, io) => {

  /* =========================
   * CREAR HISTORIAL CLÍNICO
   * ========================= */
  socket.on('historial:crear', async (data, cb) => {
    try {
      const historial = await HistorialClinicoBusiness.crearHistorial(
        socket.session,
        data
      );

      cb({ ok: true, data: historial });

      // Notificar que la cita ya tiene historial
      io.emit('historial:creado', {
        cita_id: data.cita_id,
        historial_id: historial.id
      });

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER HISTORIAL POR CITA
   * ========================= */
  socket.on('historial:por_cita', async ({ cita_id }, cb) => {
    try {
      const historial = await HistorialClinicoBusiness.obtenerPorCita(
        socket.session,
        cita_id
      );

      cb({ ok: true, data: historial });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * LISTAR HISTORIAL DE PACIENTE
   * ========================= */
  socket.on('historial:por_paciente', async ({ paciente_id }, cb) => {
    try {
      const data = await HistorialClinicoBusiness.listarPorPaciente(
        socket.session,
        paciente_id
      );

      cb({ ok: true, data });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER HISTORIAL POR ID
   * ========================= */
  socket.on('historial:obtener', async ({ historial_id }, cb) => {
    try {
      const historial = await HistorialClinicoBusiness.obtener(
        socket.session,
        historial_id
      );

      cb({ ok: true, data: historial });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
