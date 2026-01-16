// /business/usuarios.business.js
const PersonasDAO = require('../persistence/personas.persistence');
const UsuariosDAO = require('../persistence/usuarios.persistence');

const Persona = require('../model/personas.model');
const Usuario = require('../model/usuarios.model');

const { hashPassword } = require('../utils/hash.util');
const AuditoriaBusiness = require('./auditoria.business');

class UsuariosBusiness {

  /**
   * Crear usuario (persona + usuario)
   */
  static async crear({ personaData, usuarioData, user }) {
    if (!user?.clinic_id) {
      throw new Error('Contexto de clínica inválido');
    }

    const personasDAO = new PersonasDAO();
    const usuariosDAO = new UsuariosDAO(user.clinic_id);

    // 1️⃣ Verificar si la persona ya existe por DNI
    let persona = await personasDAO.getByDni(personaData.dni);

    if (!persona) {
      persona = new Persona(personaData);
      persona = await personasDAO.insert(persona);
    }

    // 2️⃣ Crear usuario
    const password_hash = await hashPassword(usuarioData.password);

    const usuario = new Usuario({
      persona_id: persona.id,
      email: usuarioData.email,
      password_hash,
      rol: usuarioData.rol
    });

    const usuarioCreado = await usuariosDAO.insert(usuario);

    // 3️⃣ Auditoría
    await AuditoriaBusiness.registrar({
      user,
      accion: 'CREATE',
      tabla: 'usuarios',
      registro_id: usuarioCreado.id,
      descripcion: `Creación de usuario ${usuarioCreado.email}`
    });

    return usuarioCreado;
  }

  /**
   * Actualizar datos administrativos del usuario
   */
  static async actualizar({ usuarioId, data, user }) {
    const usuariosDAO = new UsuariosDAO(user.clinic_id);

    const usuario = await usuariosDAO.getById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    usuario.email = data.email ?? usuario.email;
    usuario.rol = data.rol ?? usuario.rol;
    usuario.activo = typeof data.activo === 'boolean'
      ? data.activo
      : usuario.activo;

    const actualizado = await usuariosDAO.update(usuario);

    await AuditoriaBusiness.registrar({
      user,
      accion: 'UPDATE',
      tabla: 'usuarios',
      registro_id: actualizado.id,
      descripcion: `Actualización de usuario ${actualizado.email}`
    });

    return actualizado;
  }

  /**
   * Cambiar contraseña
   */
  static async cambiarPassword({ usuarioId, newPassword, user }) {
    const usuariosDAO = new UsuariosDAO(user.clinic_id);

    const hash = await hashPassword(newPassword);
    const actualizado = await usuariosDAO.updatePassword(usuarioId, hash);

    if (!actualizado) {
      throw new Error('Usuario no encontrado');
    }

    await AuditoriaBusiness.registrar({
      user,
      accion: 'UPDATE_PASSWORD',
      tabla: 'usuarios',
      registro_id: usuarioId,
      descripcion: 'Cambio de contraseña'
    });

    return true;
  }

  /**
   * Activar / desactivar usuario
   */
  static async setActivo({ usuarioId, activo, user }) {
    const usuariosDAO = new UsuariosDAO(user.clinic_id);

    const actualizado = await usuariosDAO.setActivo(usuarioId, activo);
    if (!actualizado) {
      throw new Error('Usuario no encontrado');
    }

    await AuditoriaBusiness.registrar({
      user,
      accion: activo ? 'ACTIVATE' : 'DEACTIVATE',
      tabla: 'usuarios',
      registro_id: usuarioId,
      descripcion: activo
        ? 'Usuario activado'
        : 'Usuario desactivado'
    });

    return actualizado;
  }

  /**
   * Obtener usuario por ID
   */
  static async getById({ usuarioId, user }) {
    const usuariosDAO = new UsuariosDAO(user.clinic_id);
    return usuariosDAO.getById(usuarioId);
  }

  /**
   * Listar usuarios
   */
  static async listar({ filter = {}, user }) {
    const usuariosDAO = new UsuariosDAO(user.clinic_id);
    return usuariosDAO.findByFilter(filter);
  }
}

module.exports = UsuariosBusiness;
