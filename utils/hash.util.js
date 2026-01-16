// /utils/hash.util.js
const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);

if (!SALT_ROUNDS) {
  throw new Error('BCRYPT_SALT_ROUNDS no está definido en el .env');
}

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
