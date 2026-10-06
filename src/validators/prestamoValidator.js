const { idValido } = require('./equipoValidator');

const enteroPositivo = (valor) => Number.isInteger(valor) && valor >= 1;

// profesorId es opcional: solo lo envía el administrador al elegir al profesor.
function validarPrestamo(req, res, next) {
  const { equipoId, diasPrestamo, profesorId } = req.body || {};
  const errores = [];

  if (!idValido(equipoId)) errores.push('equipoId no es válido');
  if (!enteroPositivo(diasPrestamo) || diasPrestamo > 365) errores.push('diasPrestamo debe ser un número entero entre 1 y 365');
  if (profesorId != null && !idValido(profesorId)) errores.push('profesorId no es válido');

  if (errores.length) return res.status(400).json({ errores });

  req.datos = { equipoId, diasPrestamo, profesorId };
  next();
}

module.exports = { validarPrestamo };
