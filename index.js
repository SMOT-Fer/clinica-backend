require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
  res.send('API Clinica SaaS funcionando 🚀');
});

app.get('/test-db', async (req, res) => {
  const result = await pool.query('select now()');
  res.json(result.rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor escuchando en puerto', PORT);
});
