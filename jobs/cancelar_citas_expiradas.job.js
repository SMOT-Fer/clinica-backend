// jobs/cancelar_citas_expiradas.job.js

const CitasPersistence = require('../persistence/citas.persistence');
const CitasBusiness = require('../business/citas.busines');

const citasPersistence = new CitasPersistence();

// sesión del sistema (NO usuario real)
const systemSession = {
  usuario_id: null,
  rol: 'system',
  clinic_id: null
};

async function ejecutar() {
  const citasExpiradas = await citasPersistence.obtenerCitasExpiradas();

  for (const cita of citasExpiradas) {
    try {
      await CitasBusiness.cancelarCitaPorTimeout(
        systemSession,
        cita.id
      );
    } catch (error) {
      console.error(
        `[JOB cancelar_citas] error cita ${cita.id}:`,
        error.message
      );
    }
  }
}

module.exports = { ejecutar };
