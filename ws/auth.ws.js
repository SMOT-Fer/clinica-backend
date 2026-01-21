const AuthBusiness = require('../business/auth.business');

module.exports = (socket) => {

  socket.on('auth:login', async ({ email, password }, cb) => {
    try {
      const result = await AuthBusiness.login({
        email,
        password,
        socket_id: socket.id
      });

      socket.data.session = {
        id: result.session_id,
        usuario_id: result.usuario.id,
        clinic_id: result.usuario.clinic_id,
        rol: result.usuario.rol
      };

      cb({ ok: true, data: result });
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on('auth:restore', async ({ token }, cb) => {
    try {
      const sesion = await AuthBusiness.validarSesion(token);

      socket.data.session = {
        id: sesion.id,
        usuario_id: sesion.usuario_id,
        clinic_id: sesion.clinic_id,
        rol: sesion.rol
      };

      cb({ ok: true, data: sesion });
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on('auth:logout', async (_, cb) => {
    try {
      const session = socket.data.session;
      if (session?.id) {
        await AuthBusiness.logout(session.id);
      }
      cb({ ok: true });
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

};
