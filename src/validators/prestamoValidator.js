function validarPrestamo(req, res, next) {
  const equipoId = req.body?.equipoId;
  if (!Number.isInteger(equipoId) || equipoId < 1) {
    return res.status(400).json({ errores: ['equipoId debe ser un número entero positivo'] });
  }
  req.datos = { equipoId };
  next();
}

module.exports = { validarPrestamo };
