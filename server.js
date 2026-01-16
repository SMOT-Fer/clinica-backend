// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const wsRouter = require('./ws');

const app = express();

/* =========================
   Middlewares globales
========================= */
app.use(cors());                  // ajustable luego
app.use(express.json());          // body parser
app.use(express.urlencoded({ extended: true }));

/* =========================
   Health check (Render)
========================= */
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Backend Clinica SaaS',
    timestamp: new Date()
  });
});

/* =========================
   Web Services
========================= */
app.use('/ws', wsRouter);

/* =========================
   Error handler final
========================= */
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

/* =========================
   Server listen
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
