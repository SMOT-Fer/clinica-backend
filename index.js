require('dotenv').config();
const pool = require('./dbmanager/postgres');

async function testDB() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Conexión OK:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error de conexión:', error);
    process.exit(1);
  }
}

testDB();
