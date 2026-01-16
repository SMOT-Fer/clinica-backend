// /business/clinicas.business.js
const ClinicasDAO = require('../persistence/clinicas.persistence');
const Clinica = require('../model/clinicas.model');
const AuditoriaBusiness = require('./auditoria.business');

class ClinicasBusiness {

  /**
   * Crear clínica
   */
  static async crear({ data, user }) {
    const clinicasDAO = new ClinicasDAO();

    const clinica = new Clinica(data);
    const creada = await clinicasDAO.insert(clinica);

    await AuditoriaBusiness.registrar({
      user,
      accion: 'CREATE',
      tabla: 'clinicas',
      registro_id: creada.id,
      descripcion: `Creación de clínica ${creada.nombre}`
    });

    return creada;
  }

  /**
   * Actualizar clínica
   */
  static async actualizar({ clinicaId, data, user }) {
    const clinicasDAO = new ClinicasDAO();

    const clinica = await clinicasDAO.getById(clinicaId);
    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    clinica.nombre = data.nombre ?? clinica.nombre;
    clinica.ruc = data.ruc ?? clinica.ruc;
    clinica.direccion = data.direccion ?? clinica.direccion;
    clinica.telefono = data.telefono ?? clinica.telefono;
    clinica.plan = data.plan ?? clinica.plan;

    const actualizada = await clinicasDAO.update(clinica);

    await AuditoriaBusiness.registrar({
      user,
      accion: 'UPDATE',
      tabla: 'clinicas',
      registro_id: actualizada.id,
      descripcion: `Actualización de clínica ${actualizada.nombre}`
    });

    return actualizada;
  }

  /**
   * Activar / desactivar clínica
   */
  static async setActiva({ clinicaId, activa, user }) {
    const clinicasDAO = new ClinicasDAO();

    const actualizada = await clinicasDAO.setActiva(clinicaId, activa);
    if (!actualizada) {
      throw new Error('Clínica no encontrada');
    }

    await AuditoriaBusiness.registrar({
      user,
      accion: activa ? 'ACTIVATE' : 'DEACTIVATE',
      tabla: 'clinicas',
      registro_id: clinicaId,
      descripcion: activa
        ? 'Clínica activada'
        : 'Clínica desactivada'
    });

    return actualizada;
  }

  /**
   * Obtener clínica por ID
   */
  static async getById({ clinicaId }) {
    const clinicasDAO = new ClinicasDAO();
    return clinicasDAO.getById(clinicaId);
  }

  /**
   * Listar clínicas (superadmin)
   */
  static async listar({ filter = {} }) {
    const clinicasDAO = new ClinicasDAO();

    if (Object.keys(filter).length > 0) {
      return clinicasDAO.findByFilter(filter);
    }

    return clinicasDAO.listAll();
  }
}

module.exports = ClinicasBusiness;
