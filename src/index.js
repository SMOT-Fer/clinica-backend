require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar rutas del sistema
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const paymentRoutes = require('./routes/payments');
const treatmentRoutes = require('./routes/treatments');
const auditRoutes = require('./routes/audit');
const userRoutes = require("./routes/users");

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Conectar módulos (rutas)
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/payments', paymentRoutes);
app.use('/treatments', treatmentRoutes);
app.use('/audit', auditRoutes);
app.use("/users", userRoutes);


// Endpoint de salud
app.get('/', (req, res) => {
  res.send('API Clinica SaaS funcionando 🚀');
});

// Puerto compatible con Render y local
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor activo en puerto', PORT);
});
