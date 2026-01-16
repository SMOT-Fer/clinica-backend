// /business/historial_clinico.business.js
const HistorialClinicoDAO = require('../persistence/historial_clinico.persistence');
const CitasDAO = require('../persistence/citas.persistence');
const PacientesDAO = require('../persistence/pacientes.persistence');

const HistorialClinico = require('../model/historial_clinico.model');
const AuditoriaBusiness = require('./auditoria.business');

class HistorialClinicoBusiness {

  /**
   * Registrar historial clínico de una cita
   */
  static async crear({ data, user }) {
    if (!user?.clinic_id) {
      throw new Error('Contexto de clínica inválido');
    }

    const historialDAO = new HistorialClinicoDAO();
    const citasDAO = new CitasDAO(user.clinic_id);
    const pacientesDAO = new PacientesDAO(user.clinic_id);

    // 1️⃣ Validar cita
    const cita = await citasDAO.getById(data.cita_id);
    if (!cita) {
      throw new Error('Cita no válida');
    }

    // 2️⃣ Validar paciente
    const paciente = await pacientesDAO.getById(data.paciente_id);
    if (!paciente) {
      throw new Error('Paciente no válido');
    }

    // 3️⃣ Consistencia cita–paciente
    if (cita.paciente_id !== paciente.id) {
      throw new Error('La cita no pertenece al paciente');
    }

    // 4️⃣ Crear historial clínico
    const historial = new HistorialClinico({
      clinic_id: user.clinic_id,
      paciente_id: paciente.id,
      cita_id: cita.id,
      observaciones: data.observaciones ?? null,
      diagnostico: data.diagnostico ?? null
    });

    const creado = await historialDAO.insert(historial);

    // 5️⃣ Auditoría
    await AuditoriaBusiness.registrar({
      user,
      accion: 'CREATE',
      tabla: 'historial_clinico',
      registro_id: creado.id,
      descripcion: 'Registro de historial clínico'
    });

    return creado;
  }

  /**
   * Obtener historial clínico por ID
   */
  static async getById({ historialId, user }) {
    const historialDAO = new HistorialClinicoDAO();
    return historialDAO.getById(historialId);
  }

  /**
   * Listar / buscar historial clínico
   */
  static async listar({ filter = {}, user }) {
    const historialDAO = new HistorialClinicoDAO();
    return historialDAO.findByFilter({
      ...filter,
      clinic_id: user.clinic_id
    });
  }
}

module.exports = HistorialClinicoBusiness;
