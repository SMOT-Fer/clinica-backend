// ws/index.js

const authSocketMiddleware = require('../middlewares/auth.middleware');

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
  io.use(authSocketMiddleware);

  io.on('connection', (socket) => {
    const { usuario_id, rol, clinic_id } = socket.session;

    // =========================
    // ROOMS (CLAVE PARA REALTIME)
    // =========================
    socket.join(`user:${usuario_id}`);

    if (clinic_id) {
      socket.join(`clinic:${clinic_id}`);
    }

    if (rol === 'superadmin') {
      socket.join('superadmin');
    }

    console.log(
      `[WS] conectado | user:${usuario_id} | rol:${rol} | clinic:${clinic_id} | socket:${socket.id}`
    );

    // =========================
    // REGISTRO DE WS
    // =========================
    authWS(socket, io);
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

    socket.on('disconnect', () => {
      console.log(
        `[WS] desconectado | user:${usuario_id} | socket:${socket.id}`
      );
    });
  });
};
