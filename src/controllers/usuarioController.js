const path = require('node:path');
const usuarioService = require('../services/usuarioService');

const vista = (archivo) => path.join(__dirname, '..', 'views', archivo);

function formularioRegistro(req, res) {
  res.sendFile(vista('registro.html'));
}

async function registrar(req, res) {
  res.status(201).json(await usuarioService.registrarUsuario(req.datos));
}

function formularioLogin(req, res) {
  if (req.usuario) return res.redirect('/panel');
  res.sendFile(vista('login.html'));
}

async function login(req, res) {
  const { token, usuario } = await usuarioService.login(req.datos);
  // httpOnly: el JavaScript de la página no puede leer el token.
  // sameSite strict: otros sitios no pueden enviar peticiones con esta sesión.
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: usuarioService.DURACION_TOKEN_MS,
  });
  res.json({ token, id: usuario.id, rol: usuario.rol });
}

async function logout(req, res) {
  if (req.usuario) await usuarioService.logout(req.usuario.id);
  res.clearCookie('token').status(204).end();
}

function panel(req, res) {
  res.sendFile(vista(usuarioService.vistaPanel(req.usuario)));
}

async function listarProfesores(req, res) {
  res.json((await usuarioService.listarProfesores()).map(({ id, nombre }) => ({ id, nombre })));
}

async function verificarValorMultas(req, res) {
  res.json({ valor: await usuarioService.verificarValorMultas(req.usuario.id) });
}

module.exports = { formularioRegistro, registrar, formularioLogin, login, logout, panel, listarProfesores, verificarValorMultas };
