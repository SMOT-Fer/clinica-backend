const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { requireStaffOrAdmin } = require("../middleware/roles");

const paymentService = require("../services/payment.service");

/* =====================================================
   LISTAR PAGOS
===================================================== */

router.get(
  "/",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const pagos = await paymentService.listPayments(req.user);
      res.json(pagos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* =====================================================
   FILTRO AVANZADO DE PAGOS
===================================================== */

router.get(
  "/search",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const pagos = await paymentService.searchPayments(req.user, req.query);
      res.json(pagos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* =====================================================
   MARCAR PAGO COMO PAGADO
===================================================== */

router.patch(
  "/:cita_id/pay",
  auth,
  requireStaffOrAdmin,
  async (req, res) => {
    try {
      const { metodo } = req.body;
      await paymentService.markAsPaid(req.user, req.params.cita_id, metodo);
      res.json({ message: "Pago registrado correctamente" });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

module.exports = router;
