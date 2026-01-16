// /services/perudevs.service.js
const axios = require('axios');

const BASE_URL = 'https://api.perudevs.com/api/v1/dni/complete';
const API_KEY = process.env.PERUDEVS_API_KEY;

/**
 * Convierte fecha DD/MM/YYYY a YYYY-MM-DD
 */
function parseFecha(fecha) {
  if (!fecha) return null;
  const [dd, mm, yyyy] = fecha.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Consulta DNI en PeruDevs y normaliza al modelo personas
 */
async function obtenerPersonaPorDNI(dni) {
  // Validación dura (fail fast)
  if (!dni || !/^\d{8}$/.test(dni)) {
    throw new Error('DNI inválido: debe tener 8 dígitos');
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        document: dni,
        key: API_KEY
      },
      timeout: 5000
    });

    const data = response.data;

    if (!data?.estado || !data?.resultado) {
      throw new Error('Respuesta inválida de PeruDevs');
    }

    const r = data.resultado;

    // Normalización al modelo personas
    return {
      dni: dni,
      nombres: r.nombres ?? null,
      apellido_paterno: r.apellido_paterno ?? null,
      apellido_materno: r.apellido_materno ?? null,
      telefono: null, // PeruDevs no lo provee
      fecha_nacimiento: parseFecha(r.fecha_nacimiento),
      sexo: r.genero ?? null,
      origen_datos: 'api'
    };

  } catch (error) {
    if (error.response) {
      // Error de la API
      throw new Error(
        `PeruDevs error (${error.response.status}): ${error.response.data?.mensaje || 'sin mensaje'}`
      );
    }

    // Error de red o código
    throw new Error(`Error consultando PeruDevs: ${error.message}`);
  }
}

module.exports = {
  obtenerPersonaPorDNI
};
