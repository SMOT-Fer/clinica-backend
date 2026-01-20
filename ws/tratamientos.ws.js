// ws/tratamientos.ws.js

const TratamientosBusiness = require('../business/tratamientos.business');

module.exports = (socket, io) => {

  /* =========================
   * LISTAR TRATAMIENTOS
   * ========================= */
  socket.on('tratamientos:listar', async (filtros, cb) => {
    try {
      const tratamientos = await TratamientosBusiness.listarTratamientos(
        socket.session,
        filtros || {}
      );

      cb({ ok: true, data: tratamientos });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER TRATAMIENTO
   * ========================= */
  socket.on('tratamiento:obtener', async ({ id }, cb) => {
    try {
      const tratamiento = await TratamientosBusiness.obtenerTratamiento(
        socket.session,
        id
      );

      cb({ ok: true, data: tratamiento });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * CREAR TRATAMIENTO
   * ========================= */
  socket.on('tratamiento:crear', async (data, cb) => {
    try {
      const tratamiento = await TratamientosBusiness.crearTratamiento(
        socket.session,
        data
      );

      cb({ ok: true, data: tratamiento });

      // refrescar catálogo de la clínica
      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'tratamientos:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTUALIZAR TRATAMIENTO
   * ========================= */
  socket.on('tratamiento:actualizar', async ({ id, data }, cb) => {
    try {
      const tratamiento = await TratamientosBusiness.actualizarTratamiento(
        socket.session,
        id,
        data
      );

      cb({ ok: true, data: tratamiento });
      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'tratamientos:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * DESACTIVAR TRATAMIENTO
   * ========================= */
  socket.on('tratamiento:desactivar', async ({ id }, cb) => {
    try {
      const tratamiento = await TratamientosBusiness.desactivarTratamiento(
        socket.session,
        id
      );

      cb({ ok: true, data: tratamiento });
      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'tratamientos:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTIVAR TRATAMIENTO
   * ========================= */
  socket.on('tratamiento:activar', async ({ id }, cb) => {
    try {
      const tratamiento = await TratamientosBusiness.activarTratamiento(
        socket.session,
        id
      );

      cb({ ok: true, data: tratamiento });
      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'tratamientos:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
