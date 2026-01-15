const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 🔹 CONFIGURACIÓN SaaS MEDIANO
  max: 20,                     // máximo de conexiones por instancia
  idleTimeoutMillis: 30000,    // cierra conexiones inactivas (30s)
  connectionTimeoutMillis: 2000, // espera máx para obtener conexión

  ssl: {
    rejectUnauthorized: false
  }
});


// Test opcional de conexión al iniciar
pool.on('connect', () => {
  console.log('🟢 Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('🔴 Error inesperado en PostgreSQL', err);
  process.exit(1);
});

module.exports = pool;
