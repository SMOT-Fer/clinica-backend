// /business/auth.business.js
const { comparePassword } = require('../utils/hash.util');
const jwt = require('jsonwebtoken');
const UsuariosDAO = require('../persistence/usuarios.persistence');

class AuthBusiness {

  /**
   * Login de usuario
   * @param {string} email
   * @param {string} password
   */
  static async login(email, password) {

    // 1️⃣ Validaciones básicas (fail fast)
    if (!email || !password) {
      throw new Error('Email y password son obligatorios');
    }

    // 2️⃣ Buscar usuario global (sin clinic_id)
    const userRow = await UsuariosDAO.getByEmailGlobal(email);

    if (!userRow) {
      throw new Error('Credenciales inválidas');
    }

    // 3️⃣ Verificar password
    const passwordOk = await comparePassword(
    password,
    userRow.password_hash
    );

    if (!passwordOk) {
      throw new Error('Credenciales inválidas');
    }

    // 4️⃣ Validar usuario activo (doble check defensivo)
    if (!userRow.activo) {
      throw new Error('Usuario inactivo');
    }

    // 5️⃣ Generar JWT
    const payload = {
      id: userRow.id,
      clinic_id: userRow.clinic_id,
      rol: userRow.rol,
      email: userRow.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    // 6️⃣ Retorno limpio
    return {
      token,
      user: {
        id: userRow.id,
        email: userRow.email,
        rol: userRow.rol,
        clinic_id: userRow.clinic_id
      }
    };
  }
}

module.exports = AuthBusiness;
