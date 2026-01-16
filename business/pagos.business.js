// /business/pagos.business.js
const PagosDAO = require('../persistence/pagos.persistence');
const Pago = require('../model/pagos.model');

const CitasDAO = require('../persistence/citas.persistence');
const PacientesDAO = require('../persistence/pacientes.persistence');

const AuditoriaBusiness = require('./auditoria.business');

class PagosBusiness {

  /**
   * Registrar pago (o intento)
   */
  static async crear({ data, user }) {
    if (!user?.clinic_id) {
      throw new Error('Contexto de clínica inválido');
    }

    const pagosDAO = new PagosDAO(user.clinic_id);
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

    // 4️⃣ Crear pago
    const pago = new Pago({
      paciente_id: paciente.id,
      cita_id: cita.id,
      monto: data.monto,
      metodo: data.metodo,
      estado: data.estado ?? 'pendiente',
      fecha: data.fecha ?? null
    });

    const creado = await pagosDAO.insert(pago);

    // 5️⃣ Auditoría
    await AuditoriaBusiness.registrar({
      user,
      accion: 'CREATE',
      tabla: 'pagos',
      registro_id: creado.id,
      descripcion: `Registro de pago (${creado.estado})`
    });

    return creado;
  }

  /**
   * Actualizar pago (estado / método / fecha)
   * NO permite cambiar monto
   */
  static async actualizar({ pagoId, data, user }) {
    const pagosDAO = new PagosDAO(user.clinic_id);

    const pago = await pagosDAO.getById(pagoId);
    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    pago.metodo = data.metodo ?? pago.metodo;
    pago.estado = data.estado ?? pago.estado;
    pago.fecha = data.fecha ?? pago.fecha;

    const actualizado = await pagosDAO.update(pago);

    await AuditoriaBusiness.registrar({
      user,
      accion: 'UPDATE',
      tabla: 'pagos',
      registro_id: actualizado.id,
      descripcion: `Actualización de pago (${actualizado.estado})`
    });

    return actualizado;
  }

  /**
   * Obtener pago por ID
   */
  static async getById({ pagoId, user }) {
    const pagosDAO = new PagosDAO(user.clinic_id);
    return pagosDAO.getById(pagoId);
  }

  /**
   * Listar / buscar pagos
   */
  static async listar({ filter = {}, user }) {
    const pagosDAO = new PagosDAO(user.clinic_id);

    if (Object.keys(filter).length > 0) {
      return pagosDAO.findByFilter(filter);
    }

    return pagosDAO.listAll();
  }
}

module.exports = PagosBusiness;
