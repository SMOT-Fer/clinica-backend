const pool = require("../db");
const { logAction } = require("./audit.service");

/* =====================================================
   Helpers internos
===================================================== */

async function validarPacienteClinica(paciente_id, clinic_id) {
  const { rows } = await pool.query(
    `select 1 from pacientes where id=$1 and clinic_id=$2`,
    [paciente_id, clinic_id]
  );
  return rows.length > 0;
}

async function validarDoctorClinica(doctor_id, clinic_id) {
  if (!doctor_id) return true;
  const { rows } = await pool.query(
    `select 1 from usuarios where id=$1 and clinic_id=$2`,
    [doctor_id, clinic_id]
  );
  return rows.length > 0;
}

async function existePagoPagado(cita_id, clinic_id) {
  const { rows } = await pool.query(
    `select 1 from pagos where cita_id=$1 and clinic_id=$2 and estado='pagado'`,
    [cita_id, clinic_id]
  );
  return rows.length > 0;
}

/* =====================================================
   Crear cita (TRANSACCIONAL)
===================================================== */

async function createAppointment(user, data) {
  const client = await pool.connect();
  try {
    const { clinic_id, id: usuario_id } = user;
    const { paciente_id, doctor_id, fecha, hora, tratamientos, detalles } = data;

    if (!paciente_id || !fecha || !hora || !Array.isArray(tratamientos) || !tratamientos.length) {
      throw { status: 400, message: "Datos incompletos para crear cita" };
    }

    if (!(await validarPacienteClinica(paciente_id, clinic_id))) {
      throw { status: 403, message: "Paciente no pertenece a la clínica" };
    }

    if (!(await validarDoctorClinica(doctor_id, clinic_id))) {
      throw { status: 403, message: "Doctor no pertenece a la clínica" };
    }

    await client.query("BEGIN");

    // 1️⃣ Crear cita
    const { rows: citaRows } = await client.query(
      `
      insert into citas (clinic_id, paciente_id, doctor_id, fecha, hora, estado, detalles)
      values ($1,$2,$3,$4,$5,'pendiente',$6)
      returning *
      `,
      [clinic_id, paciente_id, doctor_id || null, fecha, hora, detalles || null]
    );

    const cita = citaRows[0];

    // 2️⃣ Tratamientos + total
    let total = 0;

    for (const t of tratamientos) {
      total += Number(t.precio_aplicado);

      await client.query(
        `
        insert into cita_tratamientos (cita_id, tratamiento_id, precio_aplicado)
        values ($1,$2,$3)
        `,
        [cita.id, t.tratamiento_id, t.precio_aplicado]
      );
    }

    // 3️⃣ Pago pendiente
    await client.query(
      `
      insert into pagos (clinic_id, paciente_id, cita_id, monto)
      values ($1,$2,$3,$4)
      `,
      [clinic_id, paciente_id, cita.id, total]
    );

    await logAction({
      clinic_id,
      usuario_id,
      accion: "CREATE_APPOINTMENT",
      tabla: "citas",
      registro_id: cita.id,
      descripcion: `Cita creada. Total S/ ${total}`
    });

    await client.query("COMMIT");
    return cita;
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* =====================================================
   Reprogramar cita (solo pendiente)
===================================================== */

async function rescheduleAppointment(user, cita_id, { fecha, hora }) {
  const { clinic_id } = user;

  const result = await pool.query(
    `
    update citas
    set fecha=$1, hora=$2
    where id=$3 and clinic_id=$4 and estado='pendiente'
    `,
    [fecha, hora, cita_id, clinic_id]
  );

  if (!result.rowCount) {
    throw { status: 400, message: "La cita no puede reprogramarse" };
  }
}

/* =====================================================
   Confirmar llegada
===================================================== */

async function confirmArrival(user, cita_id) {
  const { clinic_id } = user;

  const result = await pool.query(
    `
    update citas
    set estado='confirmada'
    where id=$1 and clinic_id=$2 and estado='pendiente'
    `,
    [cita_id, clinic_id]
  );

  if (!result.rowCount) {
    throw { status: 403, message: "Acción no permitida" };
  }
}

/* =====================================================
   Marcar cita como atendida
===================================================== */

async function markAsAttended(user, cita_id) {
  const { clinic_id } = user;

  if (!(await existePagoPagado(cita_id, clinic_id))) {
    throw { status: 400, message: "No se puede atender sin pago registrado" };
  }

  const result = await pool.query(
    `
    update citas
    set estado='atendida'
    where id=$1 and clinic_id=$2 and estado='confirmada'
    `,
    [cita_id, clinic_id]
  );

  if (!result.rowCount) {
    throw { status: 403, message: "Acción no permitida" };
  }
}

/* =====================================================
   Cancelar cita (manual o automático)
===================================================== */

async function cancelAppointment(user, cita_id, motivo = "Cancelación") {
  const { clinic_id, id: usuario_id } = user;

  const result = await pool.query(
    `
    update citas
    set estado='cancelada'
    where id=$1 and clinic_id=$2 and estado <> 'cancelada'
    `,
    [cita_id, clinic_id]
  );

  if (!result.rowCount) {
    throw { status: 403, message: "Acción no permitida" };
  }

  // Cancelar pago pendiente
  await pool.query(
    `
    update pagos
    set estado='cancelado', metodo='no_hubo', fecha=now()
    where cita_id=$1 and clinic_id=$2 and estado='pendiente'
    `,
    [cita_id, clinic_id]
  );

  await logAction({
    clinic_id,
    usuario_id,
    accion: "CANCEL_APPOINTMENT",
    tabla: "citas",
    registro_id: cita_id,
    descripcion: motivo
  });
}

/* =====================================================
   Cancelación automática (+1h sin confirmar)
===================================================== */

async function autoCancelExpiredAppointments() {
  const { rows } = await pool.query(
    `
    select id, clinic_id
    from citas
    where estado='pendiente'
      and (fecha + hora) < (now() - interval '1 hour')
    `
  );

  for (const cita of rows) {
    await pool.query(
      `
      update citas
      set estado='cancelada'
      where id=$1
      `,
      [cita.id]
    );

    await pool.query(
      `
      update pagos
      set estado='cancelado', metodo='no_hubo', fecha=now()
      where cita_id=$1 and estado='pendiente'
      `,
      [cita.id]
    );

    await logAction({
      clinic_id: cita.clinic_id,
      usuario_id: null,
      accion: "AUTO_CANCEL_APPOINTMENT",
      tabla: "citas",
      registro_id: cita.id,
      descripcion: "Cancelación automática por inasistencia"
    });
  }
}

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  createAppointment,
  rescheduleAppointment,
  confirmArrival,
  markAsAttended,
  cancelAppointment,
  autoCancelExpiredAppointments
};
