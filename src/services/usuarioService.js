const crypto = require('node:crypto');
const usuarioRepository = require('../repositories/usuarioRepository');
const multaRepository = require('../repositories/multaRepository');
const { Administrador, Profesor } = require('../models/Usuario');
const error = require('../errorHttp');

const SECRETO = process.env.TOKEN_SECRET;
if (!SECRETO) throw new Error('Falta TOKEN_SECRET. Defínelo en el archivo .env de la raíz del proyecto.');
const DURACION_TOKEN_MS = 1 *60 * 60 * 1000;
const DURACION_TOKEN_JWT = DURACION_TOKEN_MS / 1000; // JWT usa segundos, no ms. 1h = 3600s

// ponytail: scryptSync bloquea el event loop unos ms por registro/login.
// Pasar a crypto.scrypt asíncrono si hay muchos usuarios concurrentes.
function hashear(contrasena) {
  const sal = crypto.randomBytes(16).toString('hex');
  return `${sal}:${crypto.scryptSync(contrasena, sal, 64).toString('hex')}`;
}

function contrasenaCorrecta(contrasena, guardada) {
  const [sal, hash] = guardada.split(':');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), crypto.scryptSync(contrasena, sal, 64));
}

const firmar = (cuerpo) => crypto.createHmac('sha256', SECRETO).update(cuerpo).digest('base64url');

function crearToken(usuario, sesionId) {
  const cuerpo = Buffer.from(
    JSON.stringify({ id: usuario.id, rol: usuario.rol, sesionId, exp: Date.now() + DURACION_TOKEN_JWT })
  ).toString('base64url');
  return `${cuerpo}.${firmar(cuerpo)}`;
}

// Devuelve { id, rol, exp } o null si el token es inválido o expiró.
function verificarToken(token) {
  const [cuerpo, firma] = String(token).split('.');
  if (!cuerpo || !firma) return null;
  const esperada = Buffer.from(firmar(cuerpo));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) return null;
  const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString());
  return datos.exp > Date.now() ? datos : null;
}

function registrarUsuario(datos) {
  if (usuarioRepository.buscarPorCorreo(datos.correo)) {
    throw error(409, 'El correo ya está registrado');
  }
  const Modelo = datos.rol === 'administrador' ? Administrador : Profesor;
  return usuarioRepository.crear(new Modelo({ ...datos, contrasena: hashear(datos.contrasena) }));
}

function login({ correo, contrasena }) {
  const usuario = usuarioRepository.buscarPorCorreo(correo);
  // Mismo mensaje en ambos casos para no revelar qué correos existen.
  if (!usuario || !contrasenaCorrecta(contrasena, usuario.contrasena)) {
    throw error(401, 'Correo o contraseña incorrectos');
  }
  return { token: crearToken(usuario), usuario };
}

// Decide qué panel le corresponde a cada tipo de usuario.
const vistaPanel = (usuario) => (usuario.rol === 'administrador' ? 'panel-admin.html' : 'panel-profesor.html');

// Valor total que el profesor debe por sus multas sin pagar.
function verificarValorMultas(usuarioId) {
  const profesor = usuarioRepository.buscarPorId(usuarioId);
  if (profesor?.rol !== 'profesor') throw error(404, 'El profesor no existe');
  profesor.susMultas = multaRepository.noPagasPorUsuario(usuarioId);
  return profesor.calcularMultasValor();
}

module.exports = {
  DURACION_TOKEN_MS,
  verificarValorMultas,
  listarProfesores: usuarioRepository.listarProfesores,
  registrarUsuario,
  login,
  crearToken,
  verificarToken,
  vistaPanel,
  existeAdministrador: usuarioRepository.existeAdministrador,
};
