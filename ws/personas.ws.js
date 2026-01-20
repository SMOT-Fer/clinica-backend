// ws/personas.ws.js

const PersonasBusiness = require('../business/personas.business');

module.exports = (socket, io) => {

  /* =========================
   * RESOLVER PERSONA POR DNI
   * BD → API → MANUAL
   * ========================= */
  socket.on('persona:resolver_dni', async ({ dni }, cb) => {
    try {
      const persona = await PersonasBusiness.resolverPersonaPorDNI(
        socket.session,
        dni
      );

      cb({ ok: true, data: persona });
    } catch (error) {
      cb({
        ok: false,
        error: error.message,
        code: 'MANUAL_REQUIRED'
      });
    }
  });

  /* =========================
   * CREAR PERSONA MANUAL
   * ========================= */
  socket.on('persona:crear_manual', async (data, cb) => {
    try {
      const persona = await PersonasBusiness.crearPersonaManual(
        socket.session,
        data
      );

      cb({ ok: true, data: persona });

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTUALIZAR PERSONA
   * ========================= */
  socket.on('persona:actualizar', async ({ persona_id, data }, cb) => {
    try {
      const persona = await PersonasBusiness.actualizarPersona(
        socket.session,
        persona_id,
        data
      );

      cb({ ok: true, data: persona });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * BUSCAR PERSONAS (SUPERADMIN)
   * ========================= */
  socket.on('personas:buscar', async (filtros, cb) => {
    try {
      const personas = await PersonasBusiness.buscarPersonas(
        socket.session,
        filtros || {}
      );

      cb({ ok: true, data: personas });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER PERSONA POR ID
   * ========================= */
  socket.on('persona:obtener', async ({ persona_id }, cb) => {
    try {
      const persona = await PersonasBusiness.obtenerPersona(
        socket.session,
        persona_id
      );

      cb({ ok: true, data: persona });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
