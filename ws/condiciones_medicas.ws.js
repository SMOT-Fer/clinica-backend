// ws/condiciones_medicas.ws.js

const CondicionesMedicasBusiness = require('../business/condiciones_medicas.business');

module.exports = (socket, io) => {

  /* =========================
   * LISTAR CONDICIONES
   * ========================= */
  socket.on('condiciones:listar', async (filtros, cb) => {
    try {
      const data = await CondicionesMedicasBusiness.listarCondiciones(
        socket.session,
        filtros || {}
      );

      cb({ ok: true, data });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER CONDICIÓN
   * ========================= */
  socket.on('condicion:obtener', async ({ id }, cb) => {
    try {
      const data = await CondicionesMedicasBusiness.obtenerCondicion(
        socket.session,
        id
      );

      cb({ ok: true, data });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * CREAR CONDICIÓN
   * ========================= */
  socket.on('condicion:crear', async (data, cb) => {
    try {
      const condicion = await CondicionesMedicasBusiness.crearCondicion(
        socket.session,
        data
      );

      cb({ ok: true, data: condicion });

      // refresco global del catálogo
      io.emit('condiciones:actualizadas');

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTUALIZAR CONDICIÓN
   * ========================= */
  socket.on('condicion:actualizar', async ({ id, data }, cb) => {
    try {
      const condicion = await CondicionesMedicasBusiness.actualizarCondicion(
        socket.session,
        id,
        data
      );

      cb({ ok: true, data: condicion });
      io.emit('condiciones:actualizadas');

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ELIMINAR CONDICIÓN
   * ========================= */
  socket.on('condicion:eliminar', async ({ id }, cb) => {
    try {
      const condicion = await CondicionesMedicasBusiness.eliminarCondicion(
        socket.session,
        id
      );

      cb({ ok: true, data: condicion });
      io.emit('condiciones:actualizadas');

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
