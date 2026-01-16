// /ws/usuarios.ws.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const UsuariosBusiness = require('../business/usuarios.business');

/**
 * POST /usuarios
 * Crear usuario
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const { personaData, usuarioData } = req.body;

      const creado = await UsuariosBusiness.crear({
        personaData,
        usuarioData,
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
 * PUT /usuarios/:id
 * Actualizar datos administrativos
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const actualizado = await UsuariosBusiness.actualizar({
        usuarioId: req.params.id,
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
 * PATCH /usuarios/:id/password
 * Cambiar contraseña
 */
router.patch(
  '/:id/password',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const { newPassword } = req.body;

      await UsuariosBusiness.cambiarPassword({
        usuarioId: req.params.id,
        newPassword,
        user: req.user
      });

      res.json({
        success: true
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
 * PATCH /usuarios/:id/activo
 * Activar / desactivar usuario
 */
router.patch(
  '/:id/activo',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const { activo } = req.body;

      const actualizado = await UsuariosBusiness.setActivo({
        usuarioId: req.params.id,
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
 * GET /usuarios/:id
 * Obtener usuario por ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const usuario = await UsuariosBusiness.getById({
        usuarioId: req.params.id,
        user: req.user
      });

      res.json({
        success: true,
        data: usuario
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
 * GET /usuarios
 * Listar usuarios
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const usuarios = await UsuariosBusiness.listar({
        filter: req.query,
        user: req.user
      });

      res.json({
        success: true,
        data: usuarios
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
