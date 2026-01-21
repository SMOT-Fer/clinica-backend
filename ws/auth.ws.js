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

      // ✅ ASOCIAR SESIÓN AL SOCKET (CLAVE)
      socket.session = {
        session_id: result.session_token || result.id,
        usuario_id: result.usuario.id,
        clinic_id: result.usuario.clinic_id,
        rol: result.usuario.rol,
        socket_id: socket.id
      };

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
    try {
      if (!socket.session?.session_id) {
        console.log('❌ Logout sin sesión asociada al socket');
        return cb({ ok: true });
      }

      await AuthBusiness.logout(socket.session.session_id);

      cb({ ok: true });
    } catch (err) {
      console.error('🔥 Error en auth:logout:', err);
      cb({ ok: false, error: err.message });
    }
  });

};
