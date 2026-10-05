const path = require('node:path');
const usuarioService = require('../services/usuarioService');
const { randomUUID } = require('crypto');

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
  const sesionId = randomUUID();
  // httpOnly: el JavaScript de la página no puede leer el token.
  // sameSite strict: otros sitios no pueden enviar peticiones con esta sesión.
  const token = usuarioService.crearToken(sesion, sesionId);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: usuarioService.DURACION_TOKEN_MS,
  });
  res.json({id: sesion.id, rol: sesion.rol});
}

function logout(req, res) {
  res.clearCookie('token').status(204).end();
}

function panel(req, res) {
  res.sendFile(vista(usuarioService.vistaPanel(req.usuario)));
}

function listarProfesores(req, res) {
  res.json(usuarioService.listarProfesores().map(({ id, nombre }) => ({ id, nombre })));
}

function verificarValorMultas(req, res) {
  res.json({ valor: usuarioService.verificarValorMultas(req.usuario.id) });
}

module.exports = { formularioRegistro, registrar, formularioLogin, login, logout, panel, listarProfesores, verificarValorMultas };
