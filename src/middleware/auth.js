const pool = require('../db');

module.exports = async function (req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { rows } = await pool.query(
      'select id, clinic_id, rol from usuarios where id = $1 and activo = true',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario inválido o inactivo' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};
