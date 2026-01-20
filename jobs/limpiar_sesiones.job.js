// jobs/limpiar_sesiones.job.js

const UserSessionsPersistence = require('../persistence/user_sessions.persistence');

const userSessionsPersistence = new UserSessionsPersistence();

async function ejecutar() {
  try {
    const cerradas = await userSessionsPersistence.cerrarSesionesInactivas(60);
    console.log(`[JOB sesiones] cerradas: ${cerradas}`);
  } catch (error) {
    console.error('[JOB sesiones] error:', error.message);
  }
}

module.exports = { ejecutar };
