// /middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * Contexto mínimo y suficiente para Business
     */
    req.user = {
      id: decoded.id,
      clinic_id: decoded.clinic_id,
      rol: decoded.rol, // admin | doctor | staff | superadmin
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido o expirado'
    });
  }
};
