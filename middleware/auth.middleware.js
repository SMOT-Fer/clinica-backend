const authBusiness = require('../business/auth.business');

module.exports = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(); // conexión sin sesión
    }

    const sesion = await authBusiness.validarSesion(token);

    socket.session = {
      session_id: sesion.id,
      usuario_id: sesion.usuario_id,
      clinic_id: sesion.clinic_id,
      rol: sesion.rol,
      socket_id: socket.id
    };

    next();
  } catch (error) {
    next(new Error(error.message || 'Sesión inválida'));
  }
};
