// /ws/index.js
const express = require('express');
const router = express.Router();

// WS
const authWS = require('./auth.ws');
const usuariosWS = require('./usuarios.ws');
const pacientesWS = require('./pacientes.ws');
const clinicasWS = require('./clinicas.ws');
const tratamientosWS = require('./tratamientos.ws');
const citasWS = require('./citas.ws');
const pagosWS = require('./pagos.ws');
const historialClinicoWS = require('./historial_clinico.ws');

// Rutas
router.use('/auth', authWS);
router.use('/usuarios', usuariosWS);
router.use('/pacientes', pacientesWS);
router.use('/clinicas', clinicasWS);
router.use('/tratamientos', tratamientosWS);
router.use('/citas', citasWS);
router.use('/pagos', pagosWS);
router.use('/historial-clinico', historialClinicoWS);

module.exports = router;
