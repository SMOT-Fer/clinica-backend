// /middleware/auth.middleware.js

const authBusiness = require('../business/auth.business');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'Session token requerido' });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Formato de token inválido' });
    }

    // 🔐 Validación real contra BD
    const sesion = await authBusiness.validarSesion(token);

    /**
     * Contexto mínimo para business
     * (NO permisos, NO decisiones aquí)
     */
    req.session = {
      session_id: sesion.id,
      usuario_id: sesion.usuario_id,
      clinic_id: sesion.clinic_id,
      socket_id: sesion.socket_id
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message || 'Sesión inválida'
    });
  }
};
