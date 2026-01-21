// ws/auth.ws.js

const AuthBusiness = require('../business/auth.business');

module.exports = (socket, io) => {

  /* =========================
   * LOGIN
   * ========================= */
  socket.on('auth:login', async (data, cb) => {
    try {
      const { email, password } = data;

      const result = await AuthBusiness.login({
        email,
        password,
        socket_id: socket.id
      });

      cb({ ok: true, data: result });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * RESTORE SESSION
   * ========================= */
  socket.on('auth:restore', async (data, cb) => {
    try {
      const { token } = data;

      const sesion = await AuthBusiness.validarSesion(token);

      socket.session = {
        session_id: sesion.id,
        usuario_id: sesion.usuario_id,
        clinic_id: sesion.clinic_id,
        rol: sesion.rol,
        socket_id: socket.id
      };

      cb({ ok: true, data: sesion });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * LOGOUT
   * ========================= */
  socket.on('auth:logout', async (_, cb) => {
    console.log('🚪 EVENTO auth:logout RECIBIDO');
    console.log('📦 socket.session:', socket.session);
    console.log('📦 socket.data:', socket.data);

    try {
      const session =
        socket.session ||
        socket.data?.session;

      if (!session) {
        console.log('❌ NO HAY SESIÓN EN SOCKET');
      } else {
        console.log('✅ CERRANDO SESSION ID:', session.id || session.session_id);
        await AuthBusiness.logout(session.id || session.session_id);
      }

      cb({ ok: true });
    } catch (err) {
      console.error('🔥 ERROR EN LOGOUT:', err);
      cb({ ok: false, error: err.message });
    }
  });

};
