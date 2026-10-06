const prestamoRepository = require('../repositories/prestamoRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const equipoService = require('./equipoService');
const Prestamo = require('../models/Prestamo');
const error = require('../errorHttp');

// Fecha y hora locales del servidor: { fecha: 'AAAA-MM-DD', hora: 'HH:MM:SS' }.
// El locale sueco da justo ese formato.
function ahora() {
  const [fecha, hora] = new Date().toLocaleString('sv-SE').split(' ');
  return { fecha, hora };
}

// Cada préstamo activo ocupa una unidad del equipo.
async function anadirPrestamoPorIdUsuario(equipoId, usuarioId, diasPrestamo) {
  if ((await usuarioRepository.buscarPorId(usuarioId))?.rol !== 'profesor') throw error(404, 'El profesor no existe');
  const equipo = await equipoService.equipoPorId(equipoId);
  if (await prestamoRepository.contarActivosPorEquipo(equipoId) >= equipo.cantidad) {
    throw error(409, 'No hay unidades disponibles de este equipo');
  }
  const inicio = ahora();
  return prestamoRepository.crear(
    equipoId, usuarioId, inicio, diasPrestamo, Prestamo.fechaEsperadaDesde(inicio.fecha, diasPrestamo)
  );
}

// El administrador ve todos los préstamos activos; el profesor, solo los suyos.
function listarPrestamos(usuario) {
  return prestamoRepository.activos(usuario.rol === 'administrador' ? undefined : usuario.id);
}

async function concluirPrestamo(id, usuario) {
  const prestamo = await prestamoRepository.buscarPorId(id);
  if (!prestamo) throw error(404, 'El préstamo no existe');
  if (usuario.rol !== 'administrador' && !prestamo.suUsuario.some((suyo) => suyo.id === usuario.id)) {
    throw error(403, 'El préstamo es de otro usuario');
  }
  if (prestamo.fechaFin) throw error(409, 'El préstamo ya fue concluido');
  // Devolver después de la fecha esperada genera una multa.
  const fin = ahora();
  return prestamoRepository.concluir(id, fin, prestamo.calcularDiasRetraso(fin.fecha));
}

module.exports = { anadirPrestamoPorIdUsuario, listarPrestamos, concluirPrestamo };
