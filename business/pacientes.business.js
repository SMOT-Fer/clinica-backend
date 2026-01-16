// /business/pacientes.business.js
const PersonasDAO = require('../persistence/personas.persistence');
const PacientesDAO = require('../persistence/pacientes.persistence');

const Persona = require('../model/personas.model');
const Paciente = require('../model/pacientes.model');

const { obtenerPersonaPorDNI } = require('../services/perudevs.service');
const AuditoriaBusiness = require('./auditoria.business');

class PacientesBusiness {

  /**
   * Crear paciente
   * - Busca persona por DNI
   * - Si no existe: usa PeruDevs o data manual
   * - Registra paciente por clínica
   */
  static async crear({ personaData, user }) {
    if (!user?.clinic_id) {
      throw new Error('Contexto de clínica inválido');
    }

    const personasDAO = new PersonasDAO();
    const pacientesDAO = new PacientesDAO(user.clinic_id);

    let persona;

    // 1️⃣ Buscar persona por DNI
    if (personaData?.dni) {
      persona = await personasDAO.getByDni(personaData.dni);
    }

    // 2️⃣ Si no existe persona, crearla
    if (!persona) {
      let dataPersona = personaData;

      // Si viene solo DNI, consultar PeruDevs
      if (personaData?.dni && personaData.origen_datos !== 'manual') {
        const apiData = await obtenerPersonaPorDNI(personaData.dni);
        dataPersona = { ...apiData, ...personaData };
      }

      persona = new Persona(dataPersona);
      persona = await personasDAO.insert(persona);
    }

    // 3️⃣ Crear paciente
    const paciente = new Paciente({
      clinic_id: user.clinic_id,
      persona_id: persona.id
    });

    const pacienteCreado = await pacientesDAO.insert(paciente);

    // 4️⃣ Auditoría
    await AuditoriaBusiness.registrar({
      user,
      accion: 'CREATE',
      tabla: 'pacientes',
      registro_id: pacienteCreado.id,
      descripcion: `Registro de paciente (persona_id=${persona.id})`
    });

    return pacienteCreado;
  }

  /**
   * Obtener paciente por ID
   */
  static async getById({ pacienteId, user }) {
    const pacientesDAO = new PacientesDAO(user.clinic_id);
    return pacientesDAO.getById(pacienteId);
  }

  /**
   * Listar pacientes por clínica
   */
  static async listar({ filter = {}, user }) {
    const pacientesDAO = new PacientesDAO(user.clinic_id);
    return pacientesDAO.findByFilter(filter);
  }
}

module.exports = PacientesBusiness;
