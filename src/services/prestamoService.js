const prestamoRepository = require('../repositories/prestamoRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const equipoService = require('./equipoService');
const error = require('../errorHttp');

// Fecha y hora locales del servidor: { fecha: 'AAAA-MM-DD', hora: 'HH:MM:SS' }.
// El locale sueco da justo ese formato.
function ahora() {
  const [fecha, hora] = new Date().toLocaleString('sv-SE').split(' ');
  return { fecha, hora };
}

// Cada préstamo activo ocupa una unidad del equipo.
function anadirPrestamoPorIdUsuario(equipoId, usuarioId) {
  if (!usuarioRepository.buscarPorId(usuarioId)) throw error(404, 'El usuario no existe');
  const equipo = equipoService.equipoPorId(equipoId);
  if (prestamoRepository.contarActivosPorEquipo(equipoId) >= equipo.cantidad) {
    throw error(409, 'No hay unidades disponibles de este equipo');
  }
  return prestamoRepository.crear(equipoId, usuarioId, ahora());
}

// El administrador ve todos los préstamos activos; el profesor, solo los suyos.
function listarPrestamos(usuario) {
  return prestamoRepository.activos(usuario.rol === 'administrador' ? undefined : usuario.id);
}

function concluirPrestamo(id, usuario) {
  const prestamo = prestamoRepository.buscarPorId(id);
  if (!prestamo) throw error(404, 'El préstamo no existe');
  if (usuario.rol !== 'administrador' && !prestamo.suUsuario.some((suyo) => suyo.id === usuario.id)) {
    throw error(403, 'El préstamo es de otro usuario');
  }
  if (prestamo.fechaFin) throw error(409, 'El préstamo ya fue concluido');
  return prestamoRepository.concluir(id, ahora());
}

module.exports = { anadirPrestamoPorIdUsuario, listarPrestamos, concluirPrestamo };
