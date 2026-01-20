// ws/auditoria.ws.js

const AuditoriaBusiness = require('../business/auditoria.business');

module.exports = (socket, io) => {

  /* =========================
   * BUSCAR AUDITORÍA
   * ========================= */
  socket.on('auditoria:buscar', async (filtros, cb) => {
    try {
      const data = await AuditoriaBusiness.buscar(
        socket.session,
        filtros
      );

      cb({ ok: true, data });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER DETALLE
   * ========================= */
  socket.on('auditoria:obtener', async ({ auditoria_id }, cb) => {
    try {
      const data = await AuditoriaBusiness.obtener(
        socket.session,
        auditoria_id
      );

      cb({ ok: true, data });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
