// /ws/historial_clinico.ws.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const HistorialClinicoBusiness = require('../business/historial_clinico.business');

/**
 * POST /historial-clinico
 * Registrar historial clínico
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['doctor']),
  async (req, res) => {
    try {
      const creado = await HistorialClinicoBusiness.crear({
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
 * GET /historial-clinico/:id
 * Obtener historial por ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const historial = await HistorialClinicoBusiness.getById({
        historialId: req.params.id,
        user: req.user
      });

      res.json({
        success: true,
        data: historial
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
 * GET /historial-clinico
 * Listar historial clínico
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const historiales = await HistorialClinicoBusiness.listar({
        filter: req.query,
        user: req.user
      });

      res.json({
        success: true,
        data: historiales
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
