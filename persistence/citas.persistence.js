const db = require('../dbmanager/postgres');
const Cita = require('../model/citas.model');

class CitasDAO {

  constructor(clinicId) {
    if (!clinicId) {
      throw new Error('clinic_id es obligatorio para CitasDAO');
    }
    this.clinicId = clinicId;
  }

  // 1️⃣ Instanciar (uso interno)
  instantiate(row) {
    if (!row) return null;

    return new Cita({
      id: row.id ?? null,
      clinic_id: row.clinic_id ?? null,
      paciente_id: row.paciente_id ?? null,
      doctor_id: row.doctor_id ?? null,
      fecha: row.fecha ?? null,
      hora: row.hora ?? null,
      estado: row.estado ?? 'pendiente',
      detalles: row.detalles ?? null,
      created_at: row.created_at ?? null
    });
  }

  // 2️⃣ Crear cita
  async insert(model) {
    const query = `
      INSERT INTO citas (
        clinic_id,
        paciente_id,
        doctor_id,
        fecha,
        hora,
        estado,
        detalles
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      this.clinicId,
      model.paciente_id,
      model.doctor_id,
      model.fecha,
      model.hora,
      model.estado ?? 'pendiente',
      model.detalles
    ];

    const { rows } = await db.query(query, values);
    return this.instantiate(rows[0]);
  }

  // 3️⃣ Update general (NO reprograma)
  async update(model) {
    if (!model.id) {
      throw new Error('id es obligatorio para actualizar una cita');
    }

    const query = `
      UPDATE citas
      SET
        paciente_id = $1,
        doctor_id = $2,
        estado = $3,
        detalles = $4
      WHERE id = $5
        AND clinic_id = $6
      RETURNING *
    `;

    const values = [
      model.paciente_id,
      model.doctor_id,
      model.estado,
      model.detalles,
      model.id,
      this.clinicId
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 4️⃣ Reprogramar cita (fecha / hora)
  async reprogramar(id, nuevaFecha, nuevaHora) {
    const query = `
      UPDATE citas
      SET
        fecha = $1,
        hora = $2
      WHERE id = $3
        AND clinic_id = $4
      RETURNING *
    `;

    const values = [
      nuevaFecha,
      nuevaHora,
      id,
      this.clinicId
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 5️⃣ Obtener por ID
  async getById(id) {
    const query = `
      SELECT *
      FROM citas
      WHERE id = $1
        AND clinic_id = $2
    `;

    const { rows } = await db.query(query, [id, this.clinicId]);
    if (rows.length === 0) return null;

    return this.instantiate(rows[0]);
  }

  // 6️⃣ Listar todas (uso admin / staff)
  async listAll() {
    const query = `
      SELECT *
      FROM citas
      WHERE clinic_id = $1
      ORDER BY fecha DESC, hora DESC
    `;

    const { rows } = await db.query(query, [this.clinicId]);
    return rows.map(r => this.instantiate(r));
  }

  // 7️⃣ Buscar por filtros (FUNCIÓN CLAVE)
  async findByFilter(filter = {}) {
    const conditions = ['c.clinic_id = $1'];
    const values = [this.clinicId];
    let idx = 2;

    // Filtros exactos
    if (filter.doctor_id) {
      conditions.push(`c.doctor_id = $${idx++}`);
      values.push(filter.doctor_id);
    }

    if (filter.paciente_id) {
      conditions.push(`c.paciente_id = $${idx++}`);
      values.push(filter.paciente_id);
    }

    if (filter.estado) {
      conditions.push(`c.estado = $${idx++}`);
      values.push(filter.estado);
    }

    // Fecha exacta / rango
    if (filter.fecha) {
      conditions.push(`c.fecha = $${idx++}`);
      values.push(filter.fecha);
    }

    if (filter.fecha_desde && filter.fecha_hasta) {
      conditions.push(`c.fecha BETWEEN $${idx} AND $${idx + 1}`);
      values.push(filter.fecha_desde, filter.fecha_hasta);
      idx += 2;
    }

    // Hora exacta / rango
    if (filter.hora) {
      conditions.push(`c.hora = $${idx++}`);
      values.push(filter.hora);
    }

    if (filter.hora_desde && filter.hora_hasta) {
      conditions.push(`c.hora BETWEEN $${idx} AND $${idx + 1}`);
      values.push(filter.hora_desde, filter.hora_hasta);
      idx += 2;
    }

    // Búsqueda textual por personas (paciente o doctor)
    if (filter.search_text && filter.search_text.trim() !== '') {
      const text = `%${filter.search_text.trim()}%`;

      conditions.push(`
        (
          pp.dni ILIKE $${idx}
          OR pp.nombres ILIKE $${idx}
          OR pp.apellido_paterno ILIKE $${idx}
          OR pp.apellido_materno ILIKE $${idx}
          OR dp.dni ILIKE $${idx}
          OR dp.nombres ILIKE $${idx}
          OR dp.apellido_paterno ILIKE $${idx}
          OR dp.apellido_materno ILIKE $${idx}
        )
      `);

      values.push(text);
      idx++;
    }

    const query = `
      SELECT c.*
      FROM citas c
      INNER JOIN pacientes pa ON pa.id = c.paciente_id
      INNER JOIN personas pp ON pp.id = pa.persona_id
      INNER JOIN usuarios du ON du.id = c.doctor_id
      INNER JOIN personas dp ON dp.id = du.persona_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.fecha DESC, c.hora DESC
    `;

    const { rows } = await db.query(query, values);
    return rows.map(r => this.instantiate(r));
  }
}

module.exports = CitasDAO;
