// business/personas.business.js

const PersonasPersistence = require('../persistence/personas.persistence');
const PeruDevsService = require('../services/perudevs.service');
const AuditoriaBusiness = require('./auditoria.business');

const personasPersistence = new PersonasPersistence();

/* =========================
 * RESOLVER PERSONA POR DNI
 * BD → API → MANUAL
 * (uso general)
 * ========================= */
async function resolverPersonaPorDNI(session, dni) {
  let persona = await personasPersistence.obtenerPorDni(dni);

  // Existe en BD
  if (persona) {
    // Si es manual, intentamos corregir con API
    if (persona.origen_datos === 'manual') {
      try {
        const dataApi = await PeruDevsService.obtenerPersonaPorDNI(dni);

        persona = await personasPersistence.actualizar(persona.id, {
          ...dataApi,
          origen_datos: 'api'
        });

        // ❌ No se audita (API)
        return persona;
      } catch {
        return persona;
      }
    }

    return persona;
  }

  // No existe → consultar API
  try {
    const dataApi = await PeruDevsService.obtenerPersonaPorDNI(dni);

    const creada = await personasPersistence.crear({
      ...dataApi,
      origen_datos: 'api'
    });

    return creada;
  } catch {
    throw new Error(
      'Persona no encontrada. Ingreso manual requerido.'
    );
  }
}

/* =========================
 * CREAR PERSONA MANUAL
 * ========================= */
async function crearPersonaManual(session, data) {
  const persona = await personasPersistence.crear({
    ...data,
    origen_datos: 'manual'
  });

  await AuditoriaBusiness.registrar(session, {
    accion: 'CREAR',
    tabla: 'personas',
    registro_id: persona.id,
    descripcion: `Persona creada manualmente (DNI: ${persona.dni})`
  });

  return persona;
}

/* =========================
 * ACTUALIZAR PERSONA
 * (solo si origen_datos = manual)
 * ========================= */
async function actualizarPersona(session, persona_id, data) {
  const persona = await personasPersistence.obtenerPorId(persona_id);

  if (!persona) {
    throw new Error('Persona no encontrada');
  }

  if (persona.origen_datos !== 'manual') {
    throw new Error(
      'No se pueden editar personas cuyo origen es API'
    );
  }

  const actualizada = await personasPersistence.actualizar(persona_id, data);

  await AuditoriaBusiness.registrar(session, {
    accion: 'ACTUALIZAR',
    tabla: 'personas',
    registro_id: persona_id,
    descripcion: `Persona actualizada manualmente (DNI: ${persona.dni})`
  });

  return actualizada;
}

/* =========================
 * BUSCAR PERSONAS (SOLO SUPERADMIN)
 * ========================= */
async function buscarPersonas(session, filtros = {}) {
  if (!session || !session.usuario_id) {
    throw new Error('Sesión inválida');
  }

  // Validación explícita aquí
  if (session.rol !== 'superadmin') {
    throw new Error(
      'Solo el superadmin puede listar o buscar personas'
    );
  }

  return personasPersistence.buscar(filtros);
}

/* =========================
 * OBTENER PERSONA POR ID
 * (uso interno / contextual)
 * ========================= */
async function obtenerPersona(session, persona_id) {
  const persona = await personasPersistence.obtenerPorId(persona_id);

  if (!persona) {
    throw new Error('Persona no encontrada');
  }

  return persona;
}

module.exports = {
  resolverPersonaPorDNI,
  crearPersonaManual,
  actualizarPersona,
  buscarPersonas,
  obtenerPersona
};
