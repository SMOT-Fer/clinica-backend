// /business/citas.business.js
const CitasDAO = require('../persistence/citas.persistence');
const CitaTratamientosDAO = require('../persistence/cita_tratamientos.persistence');
const CitaHistorialDAO = require('../persistence/cita_historial.persistence');

const Cita = require('../model/citas.model');
const CitaTratamiento = require('../model/cita_tratamientos.model');
const CitaHistorial = require('../model/cita_historial.model');

const PacientesDAO = require('../persistence/pacientes.persistence');
const UsuariosDAO = require('../persistence/usuarios.persistence');

const AuditoriaBusiness = require('./auditoria.business');

class CitasBusiness {

  /**
   * Crear cita
   */
  static async crear({ data, user }) {
    const citasDAO = new CitasDAO(user.clinic_id);
    const pacientesDAO = new PacientesDAO(user.clinic_id);
    const usuariosDAO = new UsuariosDAO(user.clinic_id);
    const citaTratamientosDAO = new CitaTratamientosDAO();

    // 1️⃣ Validar paciente
    const paciente = await pacientesDAO.getById(data.paciente_id);
    if (!paciente) {
      throw new Error('Paciente no válido');
    }

    // 2️⃣ Validar doctor
    const doctor = await usuariosDAO.getById(data.doctor_id);
    if (!doctor) {
      throw new Error('Doctor no válido');
    }

    // 3️⃣ Crear cita
    const cita = new Cita({
      paciente_id: data.paciente_id,
      doctor_id: data.doctor_id,
      fecha: data.fecha,
      hora: data.hora,
      estado: 'pendiente',
      detalles: data.detalles
    });

    const citaCreada = await citasDAO.insert(cita);

    // 4️⃣ Asociar tratamientos (si existen)
    if (Array.isArray(data.tratamientos)) {
      for (const t of data.tratamientos) {
        const ct = new CitaTratamiento({
          cita_id: citaCreada.id,
          tratamiento_id: t.tratamiento_id,
          precio_aplicado: t.precio_aplicado
        });

        await citaTratamientosDAO.insert(ct);
      }
    }

    // 5️⃣ Auditoría
    await AuditoriaBusiness.registrar({
      user,
      accion: 'CREATE',
      tabla: 'citas',
      registro_id: citaCreada.id,
      descripcion: 'Creación de cita'
    });

    return citaCreada;
  }

  /**
   * Reprogramar cita (fecha / hora)
   */
  static async reprogramar({ citaId, nuevaFecha, nuevaHora, motivo, user }) {
    const citasDAO = new CitasDAO(user.clinic_id);
    const historialDAO = new CitaHistorialDAO();

    const cita = await citasDAO.getById(citaId);
    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    // 1️⃣ Guardar historial
    const historial = new CitaHistorial({
      cita_id: cita.id,
      fecha_anterior: cita.fecha,
      hora_anterior: cita.hora,
      fecha_nueva: nuevaFecha,
      hora_nueva: nuevaHora,
      usuario_id: user.id,
      motivo
    });

    await historialDAO.insert(historial);

    // 2️⃣ Reprogramar
    const actualizada = await citasDAO.reprogramar(
      cita.id,
      nuevaFecha,
      nuevaHora
    );

    // 3️⃣ Auditoría
    await AuditoriaBusiness.registrar({
      user,
      accion: 'RESCHEDULE',
      tabla: 'citas',
      registro_id: cita.id,
      descripcion: 'Reprogramación de cita'
    });

    return actualizada;
  }

  /**
   * Cambiar estado de la cita
   */
  static async cambiarEstado({ citaId, estado, user }) {
    const citasDAO = new CitasDAO(user.clinic_id);

    const cita = await citasDAO.getById(citaId);
    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    cita.estado = estado;
    const actualizada = await citasDAO.update(cita);

    await AuditoriaBusiness.registrar({
      user,
      accion: 'UPDATE',
      tabla: 'citas',
      registro_id: citaId,
      descripcion: `Cambio de estado a ${estado}`
    });

    return actualizada;
  }

  /**
   * Obtener cita por ID
   */
  static async getById({ citaId, user }) {
    const citasDAO = new CitasDAO(user.clinic_id);
    return citasDAO.getById(citaId);
  }

  /**
   * Listar / buscar citas
   */
  static async listar({ filter = {}, user }) {
    const citasDAO = new CitasDAO(user.clinic_id);
    return citasDAO.findByFilter(filter);
  }
}

module.exports = CitasBusiness;
