// /utils/hash.util.js
const bcrypt = require('bcryptjs');

/**
 * Número de rondas para bcrypt
 * - Usa variable de entorno si existe
 * - Fallback seguro para local / scripts
 */
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

/**
 * Hashea una contraseña en texto plano
 * @param {string} plainPassword
 */
async function hashPassword(plainPassword) {
  if (!plainPassword) {
    throw new Error('Password es obligatorio para hashear');
  }

  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compara password plano vs hash
 * @param {string} plainPassword
 * @param {string} hash
 */
async function comparePassword(plainPassword, hash) {
  if (!plainPassword || !hash) {
    throw new Error('Password y hash son obligatorios para comparar');
  }

  return bcrypt.compare(plainPassword, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};
