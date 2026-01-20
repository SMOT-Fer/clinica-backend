// server.js

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// =========================
// SOCKET.IO
// =========================
const io = new Server(server, {
  cors: {
    origin: '*', // 🔧 en producción puedes restringir luego
    methods: ['GET', 'POST']
  }
});

// =========================
// WS
// =========================
require('./ws')(io);

// =========================
// JOBS
// =========================
const cancelarCitasJob = require('./jobs/cancelar_citas_expiradas.job');
const limpiarSesionesJob = require('./jobs/limpiar_sesiones.job');

// cada 5 minutos
setInterval(cancelarCitasJob.ejecutar, 5 * 60 * 1000);

// cada 10 minutos
setInterval(limpiarSesionesJob.ejecutar, 10 * 60 * 1000);

// =========================
// HARDENING BÁSICO
// =========================
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server + WS corriendo en puerto ${PORT}`);
  console.log(`🌱 NODE_ENV=${process.env.NODE_ENV}`);
});
