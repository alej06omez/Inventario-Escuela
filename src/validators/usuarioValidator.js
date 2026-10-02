const texto = (valor) => typeof valor === 'string' && valor.trim().length > 0;
const correoValido = (valor) => typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

const CAMPOS_POR_ROL = {
  administrador: ['codigo', 'area', 'departamento'],
  profesor: ['sede', 'jornada'],
};

// Valida el JSON de registro y deja en req.datos solo los campos permitidos,
// así el cliente no puede colar columnas extra.
function validarRegistro(req, res, next) {
  const body = req.body || {};
  const errores = [];

  for (const campo of ['nombre', 'institucion']) {
    if (!texto(body[campo])) errores.push(`${campo} es obligatorio`);
  }
  if (!correoValido(body.correo)) errores.push('correo no es válido');
  if (typeof body.contrasena !== 'string' || body.contrasena.length < 8) {
    errores.push('contrasena debe tener al menos 8 caracteres');
  }
  if (typeof body.telefono !== 'string' || !/^\+?\d{7,15}$/.test(body.telefono)) {
    errores.push('telefono debe tener entre 7 y 15 dígitos');
  }

  const camposRol = Object.hasOwn(CAMPOS_POR_ROL, body.rol) ? CAMPOS_POR_ROL[body.rol] : null;
  if (!camposRol) {
    errores.push('rol debe ser "administrador" o "profesor"');
  } else {
    for (const campo of camposRol) {
      if (!texto(body[campo])) errores.push(`${campo} es obligatorio`);
    }
    if (body.rol === 'profesor' && !(Array.isArray(body.materias) && body.materias.length > 0 && body.materias.every(texto))) {
      errores.push('materias debe ser una lista de textos no vacía');
    }
  }

  if (errores.length) return res.status(400).json({ errores });

  const datos = {
    rol: body.rol,
    nombre: body.nombre.trim(),
    institucion: body.institucion.trim(),
    correo: body.correo.trim().toLowerCase(),
    contrasena: body.contrasena,
    telefono: body.telefono,
  };
  for (const campo of camposRol) datos[campo] = body[campo].trim();
  if (body.rol === 'profesor') datos.materias = body.materias.map((materia) => materia.trim());

  req.datos = datos;
  next();
}

function validarLogin(req, res, next) {
  const body = req.body || {};
  const errores = [];
  if (!correoValido(body.correo)) errores.push('correo no es válido');
  if (!texto(body.contrasena)) errores.push('contrasena es obligatoria');
  if (errores.length) return res.status(400).json({ errores });

  req.datos = { correo: body.correo.trim().toLowerCase(), contrasena: body.contrasena };
  next();
}

module.exports = { validarRegistro, validarLogin };
