// /business/tratamientos.business.js
const TratamientosDAO = require('../persistence/tratamientos.persistence');
const Tratamiento = require('../model/tratamientos.model');
const AuditoriaBusiness = require('./auditoria.business');

class TratamientosBusiness {

  /**
   * Crear tratamiento
   */
  static async crear({ data, user }) {
    const tratamientosDAO = new TratamientosDAO(user.clinic_id);

    const tratamiento = new Tratamiento({
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      activo: true
    });

    const creado = await tratamientosDAO.insert(tratamiento);

    await AuditoriaBusiness.registrar({
      user,
      accion: 'CREATE',
      tabla: 'tratamientos',
      registro_id: creado.id,
      descripcion: `Creación de tratamiento ${creado.nombre}`
    });

    return creado;
  }

  /**
   * Actualizar tratamiento
   */
  static async actualizar({ tratamientoId, data, user }) {
    const tratamientosDAO = new TratamientosDAO(user.clinic_id);

    const tratamiento = await tratamientosDAO.getById(tratamientoId);
    if (!tratamiento) {
      throw new Error('Tratamiento no encontrado');
    }

    tratamiento.nombre = data.nombre ?? tratamiento.nombre;
    tratamiento.descripcion = data.descripcion ?? tratamiento.descripcion;
    tratamiento.precio = data.precio ?? tratamiento.precio;

    const actualizado = await tratamientosDAO.update(tratamiento);

    await AuditoriaBusiness.registrar({
      user,
      accion: 'UPDATE',
      tabla: 'tratamientos',
      registro_id: actualizado.id,
      descripcion: `Actualización de tratamiento ${actualizado.nombre}`
    });

    return actualizado;
  }

  /**
   * Activar / desactivar tratamiento
   */
  static async setActivo({ tratamientoId, activo, user }) {
    const tratamientosDAO = new TratamientosDAO(user.clinic_id);

    const actualizado = await tratamientosDAO.setActivo(tratamientoId, activo);
    if (!actualizado) {
      throw new Error('Tratamiento no encontrado');
    }

    await AuditoriaBusiness.registrar({
      user,
      accion: activo ? 'ACTIVATE' : 'DEACTIVATE',
      tabla: 'tratamientos',
      registro_id: tratamientoId,
      descripcion: activo
        ? 'Tratamiento activado'
        : 'Tratamiento desactivado'
    });

    return actualizado;
  }

  /**
   * Obtener tratamiento por ID
   */
  static async getById({ tratamientoId, user }) {
    const tratamientosDAO = new TratamientosDAO(user.clinic_id);
    return tratamientosDAO.getById(tratamientoId);
  }

  /**
   * Listar tratamientos
   */
  static async listar({ filter = {}, user }) {
    const tratamientosDAO = new TratamientosDAO(user.clinic_id);

    if (Object.keys(filter).length > 0) {
      return tratamientosDAO.findByFilter(filter);
    }

    return tratamientosDAO.listAll(filter);
  }
}

module.exports = TratamientosBusiness;
