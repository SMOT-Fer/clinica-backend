const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");
const pool = require("../db");

/* =====================================================
   CONSULTAR AUDITORÍA (FILTRO AVANZADO)
===================================================== */

router.get(
  "/",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      const { clinic_id } = req.user;
      const {
        usuario_id,
        accion,
        tabla,
        registro_id,
        fecha,
        fecha_desde,
        fecha_hasta
      } = req.query;

      let query = `
        select
          a.id,
          a.accion,
          a.tabla,
          a.registro_id,
          a.descripcion,
          a.fecha,
          u.email as usuario_email
        from auditoria a
        left join usuarios u on u.id = a.usuario_id
        where a.clinic_id = $1
      `;

      const params = [clinic_id];
      let idx = 2;

      if (usuario_id) {
        query += ` and a.usuario_id = $${idx++}`;
        params.push(usuario_id);
      }

      if (accion) {
        query += ` and a.accion = $${idx++}`;
        params.push(accion);
      }

      if (tabla) {
        query += ` and a.tabla = $${idx++}`;
        params.push(tabla);
      }

      if (registro_id) {
        query += ` and a.registro_id = $${idx++}`;
        params.push(registro_id);
      }

      if (fecha) {
        query += ` and date(a.fecha) = $${idx++}`;
        params.push(fecha);
      }

      if (fecha_desde) {
        query += ` and a.fecha >= $${idx++}`;
        params.push(fecha_desde);
      }

      if (fecha_hasta) {
        query += ` and a.fecha <= $${idx++}`;
        params.push(fecha_hasta);
      }

      query += ` order by a.fecha desc`;

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al consultar auditoría" });
    }
  }
);

module.exports = router;
