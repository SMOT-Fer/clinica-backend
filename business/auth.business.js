// business/auth.business.js

const crypto = require('crypto');

const UsuariosPersistence = require('../persistence/usuarios.persistence');
const UserSessionsPersistence = require('../persistence/user_sessions.persistence');
const { comparePassword } = require('../utils/hash.util');

const usuariosPersistence = new UsuariosPersistence();
const userSessionsPersistence = new UserSessionsPersistence();

/**
 * Firma un session_id para convertirlo en token
 */
function firmarSessionId(sessionId) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET no está configurado');
  }

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(sessionId)
    .digest('hex');

  return `${sessionId}.${hmac}`;
}

/**
 * Verifica token y devuelve session_id
 */
function verificarSessionToken(token) {
  if (!token) return null;

  const [sessionId, firma] = token.split('.');
  if (!sessionId || !firma) return null;

  const expected = crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(sessionId)
    .digest('hex');

  if (firma !== expected) return null;

  return sessionId;
}

/* =========================
 * LOGIN
 * ========================= */
async function login({ email, password, socket_id }) {
  if (!email || !password) {
    throw new Error('Credenciales inválidas');
  }

  const usuario = await usuariosPersistence.obtenerPorEmail(email);

  if (!usuario || !usuario.activo) {
    throw new Error('Credenciales inválidas');
  }

  const passwordOk = await comparePassword(password, usuario.password_hash);
  if (!passwordOk) {
    throw new Error('Credenciales inválidas');
  }

  const session = await userSessionsPersistence.crear({
    usuario_id: usuario.id,
    clinic_id: usuario.clinic_id || null,
    socket_id
  });

  const session_token = firmarSessionId(session.id);

  return {
    session_token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      clinic_id: usuario.clinic_id
    }
  };
}

/* =========================
 * LOGOUT
 * ========================= */
async function logout(session_id) {
  if (!session_id) return;

  await userSessionsPersistence.cerrarSesionPorId(session_id);
}

/* =========================
 * VALIDAR SESIÓN (CADA REQUEST)
 * ========================= */
async function validarSesion(session_token) {
  const sessionId = verificarSessionToken(session_token);
  if (!sessionId) {
    throw new Error('Sesión inválida');
  }

  const sesiones = await userSessionsPersistence.buscar({
    activo: true
  });

  const sesion = sesiones.find(s => s.id === sessionId);
  if (!sesion) {
    throw new Error('Sesión expirada');
  }

  const ahora = Date.now();
  const lastPing = new Date(sesion.last_ping).getTime();
  const diffMin = (ahora - lastPing) / 1000 / 60;

  if (diffMin > 30) {
    await userSessionsPersistence.cerrarSesionPorSocket(sesion.socket_id);
    throw new Error('Sesión expirada por inactividad');
  }

  // mantener viva la sesión
  await userSessionsPersistence.actualizarPing(sesion.socket_id);

  return sesion;
}

module.exports = {
  login,
  logout,
  validarSesion
};
