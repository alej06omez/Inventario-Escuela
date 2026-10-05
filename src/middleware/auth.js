const usuarioService = require('../services/usuarioService');

// Identifica al usuario por cabecera Authorization (clientes de API) o por la
// cookie de sesión (navegador). Sin credenciales la petición sigue como anónima.
function autenticar(req, res, next) {
  const cabecera = req.get('Authorization');
  if (cabecera) {
    const usuario = cabecera.startsWith('Bearer ') && usuarioService.verificarToken(cabecera.slice(7));
    if (!usuario) return res.status(401).json({ errores: ['Token inválido o expirado'] });
    req.usuario = usuario;
  } else {
    // Una cookie vencida no es un error: el usuario simplemente ya no tiene sesión.
    const cookie = req.headers.cookie?.split('; ').find((par) => par.startsWith('token='));
    req.usuario = (cookie && usuarioService.verificarToken(cookie.slice(6))) || undefined;
  }
  next();
}

function requiereSesion(req, res, next) {
  if (!req.usuario) return res.status(401).json({ errores: ['Debes iniciar sesión'] });
  next();
  const payload = verificarToken(token); // valida firma + exp, como ya tenías
  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado' });

  const sessionIdActiva = redis.get(`sesion_activa:${payload.id}`);

  if (!sessionIdActiva || sessionIdActiva !== payload.sessionId) {
    return res.status(401).json({ error: 'Sesión cerrada en otro dispositivo' });
  }

  req.usuario = payload;
  next();
}


// Para rutas que devuelven una página: sin sesión se manda al login.
function paginaConSesion(req, res, next) {
  if (!req.usuario) return res.redirect('/usuarios/login');
  next();
}

function soloAdministrador(req, res, next) {
  if (req.usuario?.rol !== 'administrador') {
    return res.status(403).json({ errores: ['Requiere permisos de administrador'] });
  }
  next();
}

// Un profesor se registra libremente. Un administrador solo lo crea otro
// administrador, salvo el primero del sistema (no hay quién lo autorice).
function permisoRegistro(req, res, next) {
  if (req.body?.rol !== 'administrador' || !usuarioService.existeAdministrador()) return next();
  soloAdministrador(req, res, next);
}

// A nombre de quién queda el préstamo: el profesor pide para sí mismo; el
// administrador para el profesor que elija. Si aún no lo eligió, usuarioId
// queda sin definir y el controlador le manda el formulario para elegirlo.
function destinatarioPrestamo(req, res, next) {
  req.datos.usuarioId = req.usuario.rol === 'administrador' ? req.datos.profesorId : req.usuario.id;
  next();
}

module.exports = { autenticar, requiereSesion, paginaConSesion, soloAdministrador, permisoRegistro, destinatarioPrestamo };
