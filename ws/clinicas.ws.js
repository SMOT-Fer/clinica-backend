// ws/clinicas.ws.js

const ClinicasBusiness = require('../business/clinicas.business');

module.exports = (socket, io) => {

  /* =========================
   * CREAR CLÍNICA
   * ========================= */
  socket.on('clinica:crear', async (data, cb) => {
    try {
      const clinica = await ClinicasBusiness.crearClinica(
        socket.session,
        data
      );

      cb({ ok: true, data: clinica });

      // Broadcast global (solo superadmin suele estar escuchando)
      io.emit('clinicas:actualizadas');

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * LISTAR CLÍNICAS
   * ========================= */
  socket.on('clinicas:listar', async (filtros, cb) => {
    try {
      const clinicas = await ClinicasBusiness.listarClinicas(
        socket.session,
        filtros || {}
      );

      cb({ ok: true, data: clinicas });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER CLÍNICA
   * ========================= */
  socket.on('clinica:obtener', async ({ clinica_id }, cb) => {
    try {
      const clinica = await ClinicasBusiness.obtenerClinica(
        socket.session,
        clinica_id
      );

      cb({ ok: true, data: clinica });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTUALIZAR CLÍNICA
   * ========================= */
  socket.on('clinica:actualizar', async ({ clinica_id, data }, cb) => {
    try {
      const clinica = await ClinicasBusiness.actualizarClinica(
        socket.session,
        clinica_id,
        data
      );

      cb({ ok: true, data: clinica });
      io.emit('clinicas:actualizadas');

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTIVAR CLÍNICA
   * ========================= */
  socket.on('clinica:activar', async ({ clinica_id }, cb) => {
    try {
      const clinica = await ClinicasBusiness.activarClinica(
        socket.session,
        clinica_id
      );

      cb({ ok: true, data: clinica });
      io.emit('clinicas:actualizadas');

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * DESACTIVAR CLÍNICA
   * ========================= */
  socket.on('clinica:desactivar', async ({ clinica_id }, cb) => {
    try {
      const clinica = await ClinicasBusiness.desactivarClinica(
        socket.session,
        clinica_id
      );

      cb({ ok: true, data: clinica });
      io.emit('clinicas:actualizadas');

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
