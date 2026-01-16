// /middleware/role.middleware.js
module.exports = function roleMiddleware(rolesPermitidos = []) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        message: 'Acceso denegado por rol'
      });
    }

    next();
  };
};
