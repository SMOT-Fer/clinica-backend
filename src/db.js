const { Pool } = require('pg');

/*
  Pool = gestor de conexiones.
  Mantiene conexiones abiertas para no reconectarse cada vez.
*/
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/*
  Exportamos el pool.
  Todas las consultas del sistema usan este objeto.
*/
module.exports = pool;
