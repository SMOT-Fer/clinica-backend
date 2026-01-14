const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const { logAction } = require("../services/audit.service");
const { requireAdmin, requireStaffOrAdmin } = require("../middleware/roles");

/* =========================
   Crear tratamiento (solo admin)
========================= */

router.post(
  "/",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const { clinic_id, id: usuario_id } = req.user;
      const { nombre, descripcion, precio } = req.body;

      if (!nombre || !precio) {
        return res.status(400).json({ error: "Nombre y precio son obligatorios" });
      }

      const { rows } = await pool.query(
        `
        insert into tratamientos (clinic_id, nombre, descripcion, precio)
        values ($1,$2,$3,$4)
        returning *
        `,
        [clinic_id, nombre, descripcion, precio]
      );

      await logAction({
        clinic_id,
        usuario_id,
        accion: "CREATE_TREATMENT",
        tabla: "tratamientos",
        registro_id: rows[0].id,
        descripcion: `Tratamiento creado: ${nombre} (S/ ${precio})`
      });

      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al crear tratamiento" });
    }
  }
);

/* =========================
   Listar tratamientos activos (admin + staff)
========================= */

router.get(
  "/",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const { clinic_id } = req.user;

      const { rows } = await pool.query(
        `
        select id, nombre, descripcion, precio, activo
        from tratamientos
        where clinic_id=$1 and activo=true
        order by nombre
        `,
        [clinic_id]
      );

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al listar tratamientos" });
    }
  }
);

/* =========================
   Buscar tratamientos (admin + staff)
========================= */

router.get(
  "/search",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const { clinic_id } = req.user;
      const { q } = req.query;

      const { rows } = await pool.query(
        `
        select id, nombre, descripcion, precio, activo
        from tratamientos
        where clinic_id=$1
          and nombre ilike '%'||$2||'%'
        order by nombre
        limit 20
        `,
        [clinic_id, q]
      );

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al buscar tratamientos" });
    }
  }
);

/* =========================
   Actualizar tratamiento (solo admin)
========================= */

router.put(
  "/:id",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio } = req.body;
      const { clinic_id, id: usuario_id } = req.user;

      const { rows } = await pool.query(
        `
        update tratamientos
        set nombre=$1,
            descripcion=$2,
            precio=$3
        where id=$4 and clinic_id=$5
        returning *
        `,
        [nombre, descripcion, precio, id, clinic_id]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Tratamiento no encontrado" });
      }

      await logAction({
        clinic_id,
        usuario_id,
        accion: "UPDATE_TREATMENT",
        tabla: "tratamientos",
        registro_id: id,
        descripcion: `Tratamiento actualizado: ${nombre}`
      });

      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al actualizar tratamiento" });
    }
  }
);

/* =========================
   Desactivar tratamiento (soft delete - solo admin)
========================= */

router.patch(
  "/:id/disable",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { clinic_id, id: usuario_id } = req.user;

      const { rowCount } = await pool.query(
        `
        update tratamientos
        set activo=false
        where id=$1 and clinic_id=$2
        `,
        [id, clinic_id]
      );

      if (!rowCount) {
        return res.status(404).json({ error: "Tratamiento no encontrado" });
      }

      await logAction({
        clinic_id,
        usuario_id,
        accion: "DISABLE_TREATMENT",
        tabla: "tratamientos",
        registro_id: id,
        descripcion: "Tratamiento desactivado"
      });

      res.json({ message: "Tratamiento desactivado" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al desactivar tratamiento" });
    }
  }
);

/* =========================
   Eliminar tratamiento (hard delete - solo admin)
========================= */

router.delete(
  "/:id",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { clinic_id, id: usuario_id } = req.user;

      const used = await pool.query(
        `select 1 from cita_tratamientos where tratamiento_id=$1 limit 1`,
        [id]
      );

      if (used.rows.length) {
        return res.status(400).json({
          error: "No se puede eliminar, el tratamiento ya fue usado en citas"
        });
      }

      const { rowCount } = await pool.query(
        `delete from tratamientos where id=$1 and clinic_id=$2`,
        [id, clinic_id]
      );

      if (!rowCount) {
        return res.status(404).json({ error: "Tratamiento no encontrado" });
      }

      await logAction({
        clinic_id,
        usuario_id,
        accion: "DELETE_TREATMENT",
        tabla: "tratamientos",
        registro_id: id,
        descripcion: "Tratamiento eliminado definitivamente"
      });

      res.json({ message: "Tratamiento eliminado" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al eliminar tratamiento" });
    }
  }
);

module.exports = router;
