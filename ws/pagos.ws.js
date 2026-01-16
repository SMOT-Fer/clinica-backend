// /ws/pagos.ws.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const PagosBusiness = require('../business/pagos.business');

/**
 * POST /pagos
 * Registrar pago
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff']),
  async (req, res) => {
    try {
      const creado = await PagosBusiness.crear({
        data: req.body,
        user: req.user
      });

      res.json({
        success: true,
        data: creado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * PUT /pagos/:id
 * Actualizar pago (NO monto)
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'staff']),
  async (req, res) => {
    try {
      const actualizado = await PagosBusiness.actualizar({
        pagoId: req.params.id,
        data: req.body,
        user: req.user
      });

      res.json({
        success: true,
        data: actualizado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /pagos/:id
 * Obtener pago por ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const pago = await PagosBusiness.getById({
        pagoId: req.params.id,
        user: req.user
      });

      res.json({
        success: true,
        data: pago
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /pagos
 * Listar / buscar pagos
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const pagos = await PagosBusiness.listar({
        filter: req.query,
        user: req.user
      });

      res.json({
        success: true,
        data: pagos
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
