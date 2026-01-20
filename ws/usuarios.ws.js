// ws/usuarios.ws.js

const UsuariosBusiness = require('../business/usuarios.business');

module.exports = (socket, io) => {

  /* =========================
   * CREAR USUARIO
   * ========================= */
  socket.on('usuario:crear', async (data, cb) => {
    try {
      const usuario = await UsuariosBusiness.crearUsuario(
        socket.session,
        data
      );

      cb({ ok: true, data: usuario });

      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'usuarios:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * LISTAR USUARIOS
   * ========================= */
  socket.on('usuarios:listar', async (filtros, cb) => {
    try {
      const usuarios = await UsuariosBusiness.listarUsuarios(
        socket.session,
        filtros || {}
      );

      cb({ ok: true, data: usuarios });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER USUARIO
   * ========================= */
  socket.on('usuario:obtener', async ({ usuario_id }, cb) => {
    try {
      const usuario = await UsuariosBusiness.obtenerUsuario(
        socket.session,
        usuario_id
      );

      cb({ ok: true, data: usuario });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTUALIZAR USUARIO
   * ========================= */
  socket.on('usuario:actualizar', async ({ usuario_id, data }, cb) => {
    try {
      const usuario = await UsuariosBusiness.actualizarUsuario(
        socket.session,
        usuario_id,
        data
      );

      cb({ ok: true, data: usuario });

      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'usuarios:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * DESACTIVAR USUARIO
   * ========================= */
  socket.on('usuario:desactivar', async ({ usuario_id }, cb) => {
    try {
      const usuario = await UsuariosBusiness.desactivarUsuario(
        socket.session,
        usuario_id
      );

      cb({ ok: true, data: usuario });

      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'usuarios:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTIVAR USUARIO
   * ========================= */
  socket.on('usuario:activar', async ({ usuario_id }, cb) => {
    try {
      const usuario = await UsuariosBusiness.activarUsuario(
        socket.session,
        usuario_id
      );

      cb({ ok: true, data: usuario });

      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'usuarios:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * RESETEAR PASSWORD (ADMIN / SUPERADMIN)
   * ========================= */
  socket.on(
    'usuario:reset_password',
    async ({ usuario_id, nuevoPassword }, cb) => {
      try {
        await UsuariosBusiness.resetearPassword(
          socket.session,
          usuario_id,
          nuevoPassword
        );

        cb({ ok: true });

      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    }
  );

  /* =========================
   * CAMBIAR MI PASSWORD
   * ========================= */
  socket.on(
    'usuario:cambiar_password',
    async ({ passwordActual, nuevoPassword }, cb) => {
      try {
        await UsuariosBusiness.cambiarMiPassword(
          socket.session,
          passwordActual,
          nuevoPassword
        );

        cb({ ok: true });

      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    }
  );

};
