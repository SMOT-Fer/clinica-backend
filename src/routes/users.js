const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");
const { logAction } = require("../services/audit.service");

/* =========================
   Crear usuario STAFF
========================= */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { email, password, persona_id } = req.body;
    const { clinic_id, id: usuario_id } = req.user;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password requeridos" });
    }

    const { rows } = await pool.query(
      `
      insert into usuarios (
        email,
        password_hash,
        rol,
        clinic_id,
        persona_id
      )
      values (
        $1,
        crypt($2, gen_salt('bf')),
        'staff',
        $3,
        $4
      )
      returning id, email, rol, activo, created_at
      `,
      [email, password, clinic_id, persona_id || null]
    );

    await logAction({
      clinic_id,
      usuario_id,
      accion: "CREATE_STAFF",
      tabla: "usuarios",
      registro_id: rows[0].id,
      descripcion: `Usuario staff creado: ${email}`
    });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear usuario staff" });
  }
});

/* =========================
   Listar usuarios STAFF
========================= */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const { clinic_id } = req.user;

    const { rows } = await pool.query(
      `
      select id, email, rol, activo, created_at
      from usuarios
      where clinic_id = $1
        and rol = 'staff'
      order by email
      `,
      [clinic_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar usuarios" });
  }
});

/* =========================
   Buscar STAFF por email
========================= */
router.get("/search", auth, requireAdmin, async (req, res) => {
  try {
    const { clinic_id } = req.user;
    const { q } = req.query;

    const { rows } = await pool.query(
      `
      select id, email, rol, activo
      from usuarios
      where clinic_id = $1
        and rol = 'staff'
        and email ilike '%' || $2 || '%'
      order by email
      limit 20
      `,
      [clinic_id, q]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar usuarios" });
  }
});

/* =========================
   Editar usuario STAFF
========================= */
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, activo } = req.body;
    const { clinic_id, id: usuario_id } = req.user;

    const { rowCount } = await pool.query(
      `
      update usuarios
      set email = $1,
          activo = $2
      where id = $3
        and clinic_id = $4
        and rol = 'staff'
      `,
      [email, activo, id, clinic_id]
    );

    if (!rowCount) {
      return res.status(404).json({ error: "Usuario staff no encontrado" });
    }

    await logAction({
      clinic_id,
      usuario_id,
      accion: "UPDATE_STAFF",
      tabla: "usuarios",
      registro_id: id,
      descripcion: "Usuario staff actualizado"
    });

    res.json({ message: "Usuario actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

/* =========================
   Desactivar usuario STAFF
========================= */
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id, id: usuario_id } = req.user;

    const { rowCount } = await pool.query(
      `
      update usuarios
      set activo = false
      where id = $1
        and clinic_id = $2
        and rol = 'staff'
      `,
      [id, clinic_id]
    );

    if (!rowCount) {
      return res.status(404).json({ error: "Usuario staff no encontrado" });
    }

    await logAction({
      clinic_id,
      usuario_id,
      accion: "DISABLE_STAFF",
      tabla: "usuarios",
      registro_id: id,
      descripcion: "Usuario staff desactivado"
    });

    res.json({ message: "Usuario desactivado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al desactivar usuario" });
  }
});

module.exports = router;
