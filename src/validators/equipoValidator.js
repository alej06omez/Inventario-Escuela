const texto = (valor) => typeof valor === 'string' && valor.trim().length > 0;

function validarId(req, res, next) {
  if (!/^\d{1,15}$/.test(req.params.id)) return res.status(400).json({ errores: ['id no es válido'] });
  req.id = Number(req.params.id);
  next();
}

// Valida el JSON de un equipo y deja en req.datos solo los campos permitidos.
function validarEquipo(req, res, next) {
  const body = req.body || {};
  const errores = [];

  if (!texto(body.nombre)) errores.push('nombre es obligatorio');
  if (!texto(body.concepto)) errores.push('concepto es obligatorio');
  if (!Number.isInteger(body.cantidad) || body.cantidad < 0) {
    errores.push('cantidad debe ser un número entero mayor o igual a 0');
  }
  if (body.descripcion != null && typeof body.descripcion !== 'string') {
    errores.push('descripcion debe ser texto');
  }

  if (errores.length) return res.status(400).json({ errores });

  req.datos = {
    nombre: body.nombre.trim(),
    concepto: body.concepto.trim(),
    cantidad: body.cantidad,
    descripcion: body.descripcion?.trim() || null,
  };
  next();
}

module.exports = { validarId, validarEquipo };
