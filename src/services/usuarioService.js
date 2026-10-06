const crypto = require('node:crypto');
const usuarioRepository = require('../repositories/usuarioRepository');
const multaRepository = require('../repositories/multaRepository');
const { Administrador, Profesor } = require('../models/Usuario');
const error = require('../errorHttp');

const SECRETO = process.env.TOKEN_SECRET;
if (!SECRETO) throw new Error('Falta TOKEN_SECRET. Defínelo en el archivo .env de la raíz del proyecto.');
// exp se compara con Date.now(), así que va en milisegundos: 1 h.
const DURACION_TOKEN_MS = 60 * 60 * 1000;

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
    JSON.stringify({ id: usuario.id, rol: usuario.rol, sesionId, exp: Date.now() + DURACION_TOKEN_MS })
  ).toString('base64url');
  return `${cuerpo}.${firmar(cuerpo)}`;
}

// Devuelve { id, rol, sesionId, exp } o null si el token es inválido o expiró.
function verificarFirma(token) {
  const [cuerpo, firma] = String(token).split('.');
  if (!cuerpo || !firma) return null;
  const esperada = Buffer.from(firmar(cuerpo));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) return null;
  const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString());
  return datos.exp > Date.now() ? datos : null;
}

// Además de la firma, la sesión del token debe ser la activa del usuario:
// un login en otro dispositivo deja inválidos los tokens anteriores.
async function verificarToken(token) {
  const datos = verificarFirma(token);
  if (!datos) return null;
  const usuario = await usuarioRepository.buscarPorId(datos.id);
  return usuario && usuario.sesionActiva === datos.sesionId ? datos : null;
}

async function registrarUsuario(datos) {
  if (await usuarioRepository.buscarPorCorreo(datos.correo)) {
    throw error(409, 'El correo ya está registrado');
  }
  const Modelo = datos.rol === 'administrador' ? Administrador : Profesor;
  return usuarioRepository.crear(new Modelo({ ...datos, contrasena: hashear(datos.contrasena) }));
}

async function login({ correo, contrasena }) {
  const usuario = await usuarioRepository.buscarPorCorreo(correo);
  // Mismo mensaje en ambos casos para no revelar qué correos existen.
  if (!usuario || !contrasenaCorrecta(contrasena, usuario.contrasena)) {
    throw error(401, 'Correo o contraseña incorrectos');
  }
  const sesionId = crypto.randomUUID();
  await usuarioRepository.guardarSesion(usuario.id, sesionId);
  return { token: crearToken(usuario, sesionId), usuario };
}

function logout(usuarioId) {
  return usuarioRepository.guardarSesion(usuarioId, null);
}

// Decide qué panel le corresponde a cada tipo de usuario.
const vistaPanel = (usuario) => (usuario.rol === 'administrador' ? 'panel-admin.html' : 'panel-profesor.html');

// Valor total que el profesor debe por sus multas sin pagar.
async function verificarValorMultas(usuarioId) {
  const profesor = await usuarioRepository.buscarPorId(usuarioId);
  if (profesor?.rol !== 'profesor') throw error(404, 'El profesor no existe');
  return profesor.calcularMultasValor(await multaRepository.noPagasPorUsuario(usuarioId));
}

module.exports = {
  DURACION_TOKEN_MS,
  verificarValorMultas,
  listarProfesores: usuarioRepository.listarProfesores,
  registrarUsuario,
  login,
  logout,
  crearToken,
  verificarToken,
  vistaPanel,
  existeAdministrador: usuarioRepository.existeAdministrador,
};
