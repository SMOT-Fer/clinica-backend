const pool = require("../db");
const { logAction } = require("./audit.service");

/* =====================================================
   Helpers
===================================================== */

async function obtenerPagoPorCita(cita_id, clinic_id) {
  const { rows } = await pool.query(
    `
    select *
    from pagos
    where cita_id=$1 and clinic_id=$2
    `,
    [cita_id, clinic_id]
  );
  return rows[0] || null;
}

/* =====================================================
   Marcar pago como PAGADO
===================================================== */

async function markAsPaid(user, cita_id, metodo) {
  const { clinic_id, id: usuario_id } = user;

  if (!metodo) {
    throw { status: 400, message: "Método de pago requerido" };
  }

  const pago = await obtenerPagoPorCita(cita_id, clinic_id);

  if (!pago) {
    throw { status: 404, message: "Pago no encontrado" };
  }

  if (pago.estado !== "pendiente") {
    throw { status: 400, message: "El pago no está pendiente" };
  }

  await pool.query(
    `
    update pagos
    set estado='pagado',
        metodo=$1,
        fecha=now()
    where id=$2 and clinic_id=$3
    `,
    [metodo, pago.id, clinic_id]
  );

  await logAction({
    clinic_id,
    usuario_id,
    accion: "PAYMENT_COMPLETED",
    tabla: "pagos",
    registro_id: pago.id,
    descripcion: `Pago registrado con método ${metodo}`
  });
}

/* =====================================================
   Obtener pagos (listado general)
===================================================== */

async function listPayments(user) {
  const { clinic_id } = user;

  const { rows } = await pool.query(
    `
    select p.*, pe.nombres, pe.apellido_paterno, pe.apellido_materno
    from pagos p
    join pacientes pa on pa.id = p.paciente_id
    join personas pe on pe.id = pa.persona_id
    where p.clinic_id=$1
    order by p.fecha desc nulls last
    `,
    [clinic_id]
  );

  return rows;
}

/* =====================================================
   Filtro avanzado de pagos
===================================================== */

async function searchPayments(user, filters) {
  const { clinic_id } = user;
  const {
    paciente_id,
    estado,
    metodo,
    monto_min,
    monto_max,
    fecha,
    fecha_desde,
    fecha_hasta
  } = filters;

  let query = `
    select p.*, pe.nombres, pe.apellido_paterno, pe.apellido_materno
    from pagos p
    join pacientes pa on pa.id = p.paciente_id
    join personas pe on pe.id = pa.persona_id
    where p.clinic_id=$1
  `;

  const params = [clinic_id];
  let idx = 2;

  if (paciente_id) {
    query += ` and p.paciente_id=$${idx++}`;
    params.push(paciente_id);
  }

  if (estado) {
    query += ` and p.estado=$${idx++}`;
    params.push(estado);
  }

  if (metodo) {
    query += ` and p.metodo=$${idx++}`;
    params.push(metodo);
  }

  if (monto_min) {
    query += ` and p.monto >= $${idx++}`;
    params.push(monto_min);
  }

  if (monto_max) {
    query += ` and p.monto <= $${idx++}`;
    params.push(monto_max);
  }

  if (fecha) {
    query += ` and date(p.fecha) = $${idx++}`;
    params.push(fecha);
  }

  if (fecha_desde) {
    query += ` and p.fecha >= $${idx++}`;
    params.push(fecha_desde);
  }

  if (fecha_hasta) {
    query += ` and p.fecha <= $${idx++}`;
    params.push(fecha_hasta);
  }

  query += ` order by p.fecha desc nulls last`;

  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = {
  markAsPaid,
  listPayments,
  searchPayments
};
