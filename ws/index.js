// ws/index.js

const authSocketMiddleware = require('../middleware/auth.middleware');

// WS handlers
const authWS = require('./auth.ws');
const auditoriaWS = require('./auditoria.ws');
const citasWS = require('./citas.ws');
const clinicasWS = require('./clinicas.ws');
const condicionesWS = require('./condiciones_medicas.ws');
const historialWS = require('./historial_clinico.ws');
const pacientesWS = require('./pacientes.ws');
const pagosWS = require('./pagos.ws');
const personasWS = require('./personas.ws');
const tratamientosWS = require('./tratamientos.ws');
const usuariosWS = require('./usuarios.ws');

module.exports = (io) => {
  // 🔐 Middleware global (permite sin token, valida si existe)
  io.use(authSocketMiddleware);

  io.on('connection', (socket) => {
    console.log(`[WS] conectado | socket:${socket.id}`);

    // =========================
    // AUTH (SIEMPRE)
    // =========================
    authWS(socket, io);

    // =========================
    // SI NO HAY SESIÓN → SOLO AUTH
    // =========================
    if (!socket.session) {
      return;
    }

    const { usuario_id, rol, clinic_id } = socket.session;

    // =========================
    // ROOMS (solo si hay sesión)
    // =========================
    socket.join(`user:${usuario_id}`);

    if (clinic_id) {
      socket.join(`clinic:${clinic_id}`);
    }

    if (rol === 'superadmin') {
      socket.join('superadmin');
    }

    console.log(
      `[WS] autenticado | user:${usuario_id} | rol:${rol} | clinic:${clinic_id} | socket:${socket.id}`
    );

    // =========================
    // WS PROTEGIDOS
    // =========================
    auditoriaWS(socket, io);
    citasWS(socket, io);
    clinicasWS(socket, io);
    condicionesWS(socket, io);
    historialWS(socket, io);
    pacientesWS(socket, io);
    pagosWS(socket, io);
    personasWS(socket, io);
    tratamientosWS(socket, io);
    usuariosWS(socket, io);

    socket.on('disconnect', async () => {
      if (socket.session?.id) {
        await AuthBusiness.logout(socket.session.id);
      }

      console.log(
        `[WS] desconectado | user:${usuario_id} | socket:${socket.id}`
      );
    });

  });
};
