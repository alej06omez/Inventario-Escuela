const path = require('node:path');
const usuarioService = require('../services/usuarioService');

const vista = (archivo) => path.join(__dirname, '..', 'views', archivo);

function formularioRegistro(req, res) {
  res.sendFile(vista('registro.html'));
}

function registrar(req, res) {
  res.status(201).json(usuarioService.registrarUsuario(req.datos));
}

function formularioLogin(req, res) {
  if (req.usuario) return res.redirect('/panel');
  res.sendFile(vista('login.html'));
}

function login(req, res) {
  const sesion = usuarioService.login(req.datos);
  // httpOnly: el JavaScript de la página no puede leer el token.
  // sameSite strict: otros sitios no pueden enviar peticiones con esta sesión.
  res.cookie('token', sesion.token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: usuarioService.DURACION_TOKEN_MS,
  });
  res.json(sesion);
}

function logout(req, res) {
  res.clearCookie('token').status(204).end();
}

function panel(req, res) {
  res.sendFile(vista(usuarioService.vistaPanel(req.usuario)));
}

module.exports = { formularioRegistro, registrar, formularioLogin, login, logout, panel };
