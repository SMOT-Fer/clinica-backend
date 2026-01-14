const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await pool.query(
    `
    select 
      u.id,
      u.rol,
      u.clinic_id,
      p.nombres,
      p.apellido_paterno
    from usuarios u
    join personas p on p.id = u.persona_id
    where u.email = $1
      and u.password_hash = crypt($2, u.password_hash)
    `,
    [email, password]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json(rows[0]);
});

module.exports = router;
