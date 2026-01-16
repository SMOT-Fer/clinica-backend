const db = require('../dbmanager/postgres');
const Pago = require('../model/pagos.model');

class PagosDAO {

  constructor(clinicId) {
    if (!clinicId) {
      throw new Error('clinic_id es obligatorio para PagosDAO');
    }
    this.clinicId = clinicId;
  }

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new Pago({
      id: row.id ?? null,
      clinic_id: row.clinic_id ?? null,
      paciente_id: row.paciente_id ?? null,
      cita_id: row.cita_id ?? null,
      monto: row.monto ?? null,
      metodo: row.metodo ?? null,
      estado: row.estado ?? 'pendiente',
      fecha: row.fecha ?? null
    });
  }

  // 2️⃣ Registrar pago (o intento)
  async insert(model) {
    const query = `
      INSERT INTO pagos (
        clinic_id,
        paciente_id,
        cita_id,
        monto,
        metodo,
        estado,
        fecha
      ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, now()))
      RETURNING *
    `;

    const values = [
      this.clinicId,
      model.paciente_id,
      model.cita_id,
      model.monto,
      model.metodo,
      model.estado ?? 'pendiente',
      model.fecha ?? null
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update controlado (NO cambia monto)
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar pago');
    }

    const query = `
      UPDATE pagos
      SET
        metodo = $1,
        estado = $2,
        fecha = $3
      WHERE id = $4
        AND clinic_id = $5
      RETURNING *
    `;

    const values = [
      model.metodo,
      model.estado,
      model.fecha,
      model.id,
      this.clinicId
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Obtener pago por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM pagos
      WHERE id = $1
        AND clinic_id = $2
    `;

    const { rows } = await db.query(query, [id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 5️⃣ Listar todos los pagos (solo admin)
  async listAll() {
    const query = `
      SELECT *
      FROM pagos
      WHERE clinic_id = $1
      ORDER BY fecha DESC
    `;

    const { rows } = await db.query(query, [this.clinicId]);
    return rows.map(row => this.instantiate(row));
  }

  // 6️⃣ Buscar pagos por filtros
  async findByFilter(filter = {}) {
    const conditions = ['clinic_id = $1'];
    const values = [this.clinicId];
    let idx = 2;

    if (filter.paciente_id) {
      conditions.push(`paciente_id = $${idx++}`);
      values.push(filter.paciente_id);
    }

    if (filter.cita_id) {
      conditions.push(`cita_id = $${idx++}`);
      values.push(filter.cita_id);
    }

    if (filter.estado) {
      conditions.push(`estado = $${idx++}`);
      values.push(filter.estado);
    }

    if (filter.metodo) {
      conditions.push(`metodo = $${idx++}`);
      values.push(filter.metodo);
    }

    if (filter.monto) {
      conditions.push(`monto = $${idx++}`);
      values.push(filter.monto);
    }

    // Fecha exacta
    if (filter.fecha) {
      conditions.push(`DATE(fecha) = $${idx++}`);
      values.push(filter.fecha);
    }

    // Intervalo de fechas
    if (filter.fecha_desde && filter.fecha_hasta) {
      conditions.push(`fecha BETWEEN $${idx} AND $${idx + 1}`);
      values.push(filter.fecha_desde, filter.fecha_hasta);
      idx += 2;
    }

    const query = `
      SELECT *
      FROM pagos
      WHERE ${conditions.join(' AND ')}
      ORDER BY fecha DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(row => this.instantiate(row));
  }
}

module.exports = PagosDAO;
