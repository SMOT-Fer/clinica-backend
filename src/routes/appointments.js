const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { requireAdmin, requireStaffOrAdmin } = require("../middleware/roles");

const appointmentService = require("../services/appointment.service");

/* =====================================================
   CREAR CITA
===================================================== */

router.post(
  "/",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const cita = await appointmentService.createAppointment(
        req.user,
        req.body
      );
      res.json(cita);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/* =====================================================
   REPROGRAMAR CITA
===================================================== */

router.patch(
  "/:id/reschedule",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      await appointmentService.rescheduleAppointment(
        req.user,
        req.params.id,
        req.body
      );
      res.json({ message: "Cita reprogramada correctamente" });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/* =====================================================
   CONFIRMAR LLEGADA
===================================================== */

router.patch(
  "/:id/confirm",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      await appointmentService.confirmArrival(req.user, req.params.id);
      res.json({ message: "Paciente confirmado" });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/* =====================================================
   MARCAR CITA COMO ATENDIDA
===================================================== */

router.patch(
  "/:id/attend",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      await appointmentService.markAsAttended(req.user, req.params.id);
      res.json({ message: "Cita marcada como atendida" });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/* =====================================================
   CANCELAR CITA (SOLO ADMIN)
===================================================== */

router.patch(
  "/:id/cancel",
  auth,
  requireAdmin,
  async (req, res) => {
    try {
      await appointmentService.cancelAppointment(
        req.user,
        req.params.id,
        "Cancelación manual por administrador"
      );
      res.json({ message: "Cita cancelada correctamente" });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

module.exports = router;
