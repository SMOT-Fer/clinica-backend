// ws/pacientes.ws.js

const PacientesBusiness = require('../business/pacientes.business');

module.exports = (socket, io) => {

  /* =========================
   * CREAR PACIENTE
   * ========================= */
  socket.on('paciente:crear', async (data, cb) => {
    try {
      const paciente = await PacientesBusiness.crearPaciente(
        socket.session,
        data
      );

      cb({ ok: true, data: paciente });

      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'pacientes:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * LISTAR PACIENTES
   * ========================= */
  socket.on('pacientes:listar', async (filtros, cb) => {
    try {
      const pacientes = await PacientesBusiness.listarPacientes(
        socket.session,
        filtros || {}
      );

      cb({ ok: true, data: pacientes });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * OBTENER PACIENTE
   * ========================= */
  socket.on('paciente:obtener', async ({ paciente_id }, cb) => {
    try {
      const paciente = await PacientesBusiness.obtenerPaciente(
        socket.session,
        paciente_id
      );

      cb({ ok: true, data: paciente });
    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ACTUALIZAR PACIENTE
   * ========================= */
  socket.on('paciente:actualizar', async ({ paciente_id, data }, cb) => {
    try {
      const paciente = await PacientesBusiness.actualizarPaciente(
        socket.session,
        paciente_id,
        data
      );

      cb({ ok: true, data: paciente });
      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'pacientes:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

  /* =========================
   * ASIGNAR CONDICIÓN MÉDICA
   * ========================= */
  socket.on(
    'paciente:asignar_condicion',
    async ({ paciente_id, condicion_medica_id, descripcion }, cb) => {
      try {
        const result = await PacientesBusiness.asignarCondicion(
          socket.session,
          paciente_id,
          condicion_medica_id,
          descripcion
        );

        cb({ ok: true, data: result });
        io.to(`clinic:${socket.session.clinic_id}`).emit(
          'pacientes:actualizados'
        );

      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    }
  );

  /* =========================
   * QUITAR CONDICIÓN MÉDICA
   * ========================= */
  socket.on(
    'paciente:quitar_condicion',
    async ({ paciente_condicion_id }, cb) => {
      try {
        const result = await PacientesBusiness.quitarCondicion(
          socket.session,
          paciente_condicion_id
        );

        cb({ ok: true, data: result });
        io.to(`clinic:${socket.session.clinic_id}`).emit(
          'pacientes:actualizados'
        );

      } catch (error) {
        cb({ ok: false, error: error.message });
      }
    }
  );

  /* =========================
   * ELIMINAR PACIENTE
   * ========================= */
  socket.on('paciente:eliminar', async ({ paciente_id }, cb) => {
    try {
      const result = await PacientesBusiness.eliminarPaciente(
        socket.session,
        paciente_id
      );

      cb({ ok: true, data: result });
      io.to(`clinic:${socket.session.clinic_id}`).emit(
        'pacientes:actualizados'
      );

    } catch (error) {
      cb({ ok: false, error: error.message });
    }
  });

};
