// /ws/tratamientos.ws.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const TratamientosBusiness = require('../business/tratamientos.business');

/**
 * POST /tratamientos
 * Crear tratamiento
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const creado = await TratamientosBusiness.crear({
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
 * PUT /tratamientos/:id
 * Actualizar tratamiento
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const actualizado = await TratamientosBusiness.actualizar({
        tratamientoId: req.params.id,
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
 * PATCH /tratamientos/:id/activo
 * Activar / desactivar tratamiento
 */
router.patch(
  '/:id/activo',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const { activo } = req.body;

      const actualizado = await TratamientosBusiness.setActivo({
        tratamientoId: req.params.id,
        activo,
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
 * GET /tratamientos/:id
 * Obtener tratamiento por ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const tratamiento = await TratamientosBusiness.getById({
        tratamientoId: req.params.id,
        user: req.user
      });

      res.json({
        success: true,
        data: tratamiento
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
 * GET /tratamientos
 * Listar tratamientos
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const tratamientos = await TratamientosBusiness.listar({
        filter: req.query,
        user: req.user
      });

      res.json({
        success: true,
        data: tratamientos
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
