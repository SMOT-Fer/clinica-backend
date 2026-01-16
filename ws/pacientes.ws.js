// /ws/pacientes.ws.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const PacientesBusiness = require('../business/pacientes.business');

/**
 * POST /pacientes
 * Registrar paciente
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff']),
  async (req, res) => {
    try {
      const { personaData } = req.body;

      const creado = await PacientesBusiness.crear({
        personaData,
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
 * GET /pacientes/:id
 * Obtener paciente por ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const paciente = await PacientesBusiness.getById({
        pacienteId: req.params.id,
        user: req.user
      });

      res.json({
        success: true,
        data: paciente
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
 * GET /pacientes
 * Listar pacientes por clínica
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'staff', 'doctor']),
  async (req, res) => {
    try {
      const pacientes = await PacientesBusiness.listar({
        filter: req.query,
        user: req.user
      });

      res.json({
        success: true,
        data: pacientes
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
