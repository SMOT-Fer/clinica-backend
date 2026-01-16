const AuditoriaDAO = require('../persistence/auditoria.persistence');
const Auditoria = require('../model/auditoria.model');

class AuditoriaBusiness {

  /**
   * Registra un evento de auditoría
   * NO bloqueante
   */
  static async registrar({
    user,
    accion,
    tabla,
    registro_id = null,
    descripcion = null
  }) {
    try {
      if (!user?.clinic_id || !user?.id) {
        throw new Error('Contexto de usuario inválido para auditoría');
      }

      if (!accion || !tabla) {
        throw new Error('Acción y tabla son obligatorias para auditoría');
      }

      const auditoriaDAO = new AuditoriaDAO(user.clinic_id);

      const auditoriaModel = new Auditoria({
        clinic_id: user.clinic_id,
        usuario_id: user.id,
        accion,
        tabla,
        registro_id,
        descripcion
      });

      await auditoriaDAO.insert(auditoriaModel);

    } catch (error) {
      // ❗ Auditoría NO bloqueante
      console.error('[AUDITORIA ERROR]', error.message);
    }
  }
}

module.exports = AuditoriaBusiness;
