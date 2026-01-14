function requireAdmin(req, res, next) {
  if (req.user.rol !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  next();
}

function requireStaffOrAdmin(req, res, next) {
  if (!["admin", "staff"].includes(req.user.rol)) {
    return res.status(403).json({ error: "Rol no autorizado" });
  }
  next();
}

module.exports = {
  requireAdmin,
  requireStaffOrAdmin
};
