module.exports = function (req, res, next) {
  const clinicId =
    req.params.clinic_id ||
    req.body.clinic_id ||
    req.query.clinic_id;

  if (!clinicId) {
    return res.status(400).json({ error: 'clinic_id requerido' });
  }

  if (clinicId !== req.user.clinic_id) {
    return res.status(403).json({ error: 'Acceso a clínica no autorizado' });
  }

  next();
};
