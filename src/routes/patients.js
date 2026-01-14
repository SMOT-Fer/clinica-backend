const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const { logAction } = require("../services/audit.service");
const axios = require("axios");

/* =========================
   Utilidades
========================= */

function parseFecha(fecha) {
  if (!fecha) return null;
  const [d, m, y] = fecha.split("/");
  return `${y}-${m}-${d}`;
}

/* =========================
   PeruDevs API
========================= */

async function consultarPeruDevs(dni) {
  const { data } = await axios.get(
    "https://api.perudevs.com/api/v1/dni/complete",
    {
      params: {
        document: dni,
        key: process.env.PERUDEVS_API_KEY
      }
    }
  );

  return data.estado ? data.resultado : null;
}

/* =========================
   Cache inteligente de personas
========================= */

async function obtenerPersonaPorDNI(dni) {
  const { rows } = await pool.query(
    `select * from personas where dni=$1`,
    [dni]
  );

  // 1️⃣ Persona ya existe
  if (rows.length) {
    const persona = rows[0];

    // Intentar enriquecer si fue manual
    if (persona.origen_datos === "manual") {
      try {
        const api = await consultarPeruDevs(dni);
        if (api) {
          await pool.query(
            `
            update personas
            set nombres=$1,
                apellido_paterno=$2,
                apellido_materno=$3,
                fecha_nacimiento=$4,
                sexo=$5,
                origen_datos='api',
                ultima_actualizacion=now()
            where dni=$6
            `,
            [
              api.nombres,
              api.apellido_paterno,
              api.apellido_materno,
              parseFecha(api.fecha_nacimiento),
              api.genero === "M" ? "Masculino" : "Femenino",
              dni
            ]
          );

          const { rows: updated } = await pool.query(
            `select * from personas where dni=$1`,
            [dni]
          );

          return {
            persona: updated[0],
            source: "api",
            message: "Datos actualizados desde RENIEC"
          };
        }
      } catch (e) {
        // silencioso por diseño
      }
    }

    return {
      persona,
      source: persona.origen_datos,
      message: "Encontrado en sistema"
    };
  }

  // 2️⃣ Persona no existe → intentar API
  try {
    const api = await consultarPeruDevs(dni);
    if (api) {
      const { rows } = await pool.query(
        `
        insert into personas
        (dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, origen_datos)
        values ($1,$2,$3,$4,$5,$6,'api')
        returning *
        `,
        [
          api.id, // DNI viene aquí por diseño de PeruDevs
          api.nombres,
          api.apellido_paterno,
          api.apellido_materno,
          parseFecha(api.fecha_nacimiento),
          api.genero === "M" ? "Masculino" : "Femenino"
        ]
      );

      return {
        persona: rows[0],
        source: "api",
        message: "Datos obtenidos de RENIEC"
      };
    }
  } catch (e) {}

  return {
    persona: null,
    source: "none",
    message: "RENIEC no disponible, ingrese datos manualmente"
  };
}

/* =========================
   Buscar persona por DNI
========================= */

router.get("/dni/:dni", auth, async (req, res) => {
  try {
    const result = await obtenerPersonaPorDNI(req.params.dni);
    res.json({ found: !!result.persona, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar DNI" });
  }
});

/* =========================
   Crear paciente
========================= */

router.post("/", auth, async (req, res) => {
  try {
    const { clinic_id, id: usuario_id } = req.user;
    const {
      dni,
      nombres,
      apellido_paterno,
      apellido_materno,
      telefono,
      fecha_nacimiento,
      sexo
    } = req.body;

    let result = await obtenerPersonaPorDNI(dni);
    let persona = result.persona;

    if (!persona) {
      const { rows } = await pool.query(
        `
        insert into personas
        (dni, nombres, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, origen_datos)
        values ($1,$2,$3,$4,$5,$6,$7,'manual')
        returning *
        `,
        [
          dni,
          nombres,
          apellido_paterno,
          apellido_materno,
          telefono,
          fecha_nacimiento,
          sexo
        ]
      );

      persona = rows[0];
      result = { source: "manual", message: "Datos ingresados manualmente" };
    }

    const exists = await pool.query(
      `select id from pacientes where persona_id=$1 and clinic_id=$2`,
      [persona.id, clinic_id]
    );

    if (exists.rows.length) {
      return res.json({
        paciente_id: exists.rows[0].id,
        persona,
        ...result
      });
    }

    const { rows } = await pool.query(
      `insert into pacientes (persona_id, clinic_id) values ($1,$2) returning id`,
      [persona.id, clinic_id]
    );

    await logAction({
      clinic_id,
      usuario_id,
      accion: "CREATE_PATIENT",
      tabla: "pacientes",
      registro_id: rows[0].id,
      descripcion: `Paciente creado con DNI ${dni}`
    });

    res.json({ paciente_id: rows[0].id, persona, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear paciente" });
  }
});

/* =========================
   Validar paciente pertenece a clínica
========================= */

async function validarPacienteClinica(paciente_id, clinic_id) {
  const { rows } = await pool.query(
    `select id from pacientes where id=$1 and clinic_id=$2`,
    [paciente_id, clinic_id]
  );
  return rows.length > 0;
}

/* =========================
   Condiciones médicas
========================= */

router.post("/:id/conditions", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { condiciones } = req.body;

    const valido = await validarPacienteClinica(id, req.user.clinic_id);
    if (!valido) {
      return res.status(403).json({ error: "Paciente no pertenece a la clínica" });
    }

    await pool.query(
      `delete from condiciones_medicas where paciente_id=$1`,
      [id]
    );

    for (const c of condiciones) {
      await pool.query(
        `insert into condiciones_medicas (paciente_id, descripcion) values ($1,$2)`,
        [id, c]
      );
    }

    res.json({ message: "Condiciones médicas actualizadas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar condiciones" });
  }
});

router.get("/:id/conditions", auth, async (req, res) => {
  try {
    const valido = await validarPacienteClinica(
      req.params.id,
      req.user.clinic_id
    );

    if (!valido) {
      return res.status(403).json({ error: "Acceso no autorizado" });
    }

    const { rows } = await pool.query(
      `select id, descripcion from condiciones_medicas where paciente_id=$1`,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener condiciones" });
  }
});

/* =========================
   Eliminar paciente
========================= */

router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { clinic_id, id: usuario_id } = req.user;

    const valido = await validarPacienteClinica(id, clinic_id);
    if (!valido) {
      return res.status(403).json({ error: "Paciente no pertenece a la clínica" });
    }

    await pool.query(
      `delete from condiciones_medicas where paciente_id=$1`,
      [id]
    );
    await pool.query(
      `delete from pacientes where id=$1 and clinic_id=$2`,
      [id, clinic_id]
    );

    await logAction({
      clinic_id,
      usuario_id,
      accion: "DELETE_PATIENT",
      tabla: "pacientes",
      registro_id: id,
      descripcion: "Paciente eliminado de la clínica"
    });

    res.json({ message: "Paciente eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar paciente" });
  }
});

/* =========================
   Listar / Buscar pacientes
========================= */

router.get("/", auth, async (req, res) => {
  const { clinic_id } = req.user;

  const { rows } = await pool.query(
    `
    select p.id, pe.dni, pe.nombres, pe.apellido_paterno, pe.apellido_materno
    from pacientes p
    join personas pe on pe.id=p.persona_id
    where p.clinic_id=$1
    order by pe.apellido_paterno, pe.nombres
    `,
    [clinic_id]
  );

  res.json(rows);
});

router.get("/search", auth, async (req, res) => {
  const { clinic_id } = req.user;
  const { q } = req.query;

  const { rows } = await pool.query(
    `
    select p.id, pe.dni, pe.nombres, pe.apellido_paterno, pe.apellido_materno
    from pacientes p
    join personas pe on pe.id=p.persona_id
    where p.clinic_id=$1
      and (
        pe.dni ilike '%'||$2||'%' or
        pe.nombres ilike '%'||$2||'%' or
        pe.apellido_paterno ilike '%'||$2||'%' or
        pe.apellido_materno ilike '%'||$2||'%'
      )
    limit 20
    `,
    [clinic_id, q]
  );

  res.json(rows);
});

/* =========================
   Editar persona (solo manual)
========================= */

router.put("/persona/:dni", auth, async (req, res) => {
  try {
    const { dni } = req.params;
    const {
      nombres,
      apellido_paterno,
      apellido_materno,
      telefono,
      fecha_nacimiento,
      sexo
    } = req.body;

    const { clinic_id, id: usuario_id } = req.user;

    const { rows } = await pool.query(
      `select * from personas where dni=$1`,
      [dni]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Persona no existe" });
    }

    const persona = rows[0];

    if (persona.origen_datos !== "manual") {
      return res.status(403).json({
        error: "Los datos provenientes de RENIEC no pueden modificarse"
      });
    }

    await pool.query(
      `
      update personas
      set nombres=$1,
          apellido_paterno=$2,
          apellido_materno=$3,
          telefono=$4,
          fecha_nacimiento=$5,
          sexo=$6,
          ultima_actualizacion=now()
      where dni=$7
      `,
      [
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
        fecha_nacimiento,
        sexo,
        dni
      ]
    );

    await logAction({
      clinic_id,
      usuario_id,
      accion: "UPDATE_PERSONA",
      tabla: "personas",
      registro_id: persona.id,
      descripcion: `Actualizó datos manuales de la persona DNI ${dni}`
    });

    res.json({ message: "Datos actualizados correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar persona" });
  }
});

module.exports = router;
