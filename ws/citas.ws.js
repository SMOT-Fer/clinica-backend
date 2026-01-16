// /ws/citas.ws.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const CitasBusiness = require('../business/citas.business');

/**
 * POST /citas
 * Crear cita
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff']),
  async (req, res) => {
    try {
      const creada = await CitasBusiness.crear({
        data: req.body,
        user: req.user
      });

      res.json({ success: true, data: creada });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * PATCH /citas/:id/reprogramar
 * Reprogramar cita
 */
router.patch(
  '/:id/reprogramar',
  authMiddleware,
  roleMiddleware(['admin', 'staff']),
  async (req, res) => {
    try {
      const { nuevaFecha, nuevaHora, motivo } = req.body;

      const actualizada = await CitasBusiness.reprogramar({
        citaId: req.params.id,
        nuevaFecha,
        nuevaHora,
        motivo,
        user: req.user
      });

      res.json({ success: true, data: actualizada });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * PATCH /citas/:id/estado
 * Cambiar estado de cita
 */
router.patch(
  '/:id/estado',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const { estado } = req.body;

      const actualizada = await CitasBusiness.cambiarEstado({
        citaId: req.params.id,
        estado,
        user: req.user
      });

      res.json({ success: true, data: actualizada });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /citas/:id
 * Obtener cita por ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const cita = await CitasBusiness.getById({
        citaId: req.params.id,
        user: req.user
      });

      res.json({ success: true, data: cita });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET /citas
 * Listar / buscar citas
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const citas = await CitasBusiness.listar({
        filter: req.query,
        user: req.user
      });

      res.json({ success: true, data: citas });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
