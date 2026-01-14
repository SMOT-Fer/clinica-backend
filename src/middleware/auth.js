const pool = require("../db");

module.exports = async function auth(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { rows } = await pool.query(
      `
      select id, clinic_id, rol
      from usuarios
      where id = $1
        and activo = true
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario inválido o inactivo" });
    }

    const user = rows[0];

    // Validación defensiva: solo roles permitidos
    if (!["admin", "staff"].includes(user.rol)) {
      return res.status(403).json({ error: "Rol no autorizado" });
    }

    // Inyectamos un objeto controlado (no la fila cruda)
    req.user = {
      id: user.id,
      clinic_id: user.clinic_id,
      rol: user.rol
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Error de autenticación" });
  }
};
