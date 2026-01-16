// /ws/clinicas.ws.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const ClinicasBusiness = require('../business/clinicas.business');

/**
 * POST /clinicas
 * Crear clínica
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['superadmin']),
  async (req, res) => {
    try {
      const creada = await ClinicasBusiness.crear({
        data: req.body,
        user: req.user
      });

      res.json({
        success: true,
        data: creada
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
 * PUT /clinicas/:id
 * Actualizar clínica
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['superadmin']),
  async (req, res) => {
    try {
      const actualizada = await ClinicasBusiness.actualizar({
        clinicaId: req.params.id,
        data: req.body,
        user: req.user
      });

      res.json({
        success: true,
        data: actualizada
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
 * PATCH /clinicas/:id/activa
 * Activar / desactivar clínica
 */
router.patch(
  '/:id/activa',
  authMiddleware,
  roleMiddleware(['superadmin']),
  async (req, res) => {
    try {
      const { activa } = req.body;

      const actualizada = await ClinicasBusiness.setActiva({
        clinicaId: req.params.id,
        activa,
        user: req.user
      });

      res.json({
        success: true,
        data: actualizada
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
 * GET /clinicas/:id
 * Obtener clínica por ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['superadmin']),
  async (req, res) => {
    try {
      const clinica = await ClinicasBusiness.getById({
        clinicaId: req.params.id
      });

      res.json({
        success: true,
        data: clinica
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
 * GET /clinicas
 * Listar clínicas (superadmin)
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['superadmin']),
  async (req, res) => {
    try {
      const clinicas = await ClinicasBusiness.listar({
        filter: req.query
      });

      res.json({
        success: true,
        data: clinicas
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
