const equipoRepository = require('../repositories/equipoRepository');
const prestamoRepository = require('../repositories/prestamoRepository');
const error = require('../errorHttp');

function exigirAdministrador(usuario) {
  if (usuario?.rol !== 'administrador') throw error(403, 'Requiere permisos de administrador');
}

function registrarEquipo(datos, usuario) {
  exigirAdministrador(usuario);
  return equipoRepository.crear(datos);
}

function listarEquipos() {
  return equipoRepository.listar();
}

async function equipoPorId(id) {
  const equipo = await equipoRepository.buscarPorId(id);
  if (!equipo) throw error(404, 'El equipo no existe');
  return equipo;
}

async function actualizarEquipo(id, datos, usuario) {
  exigirAdministrador(usuario);
  await equipoPorId(id);
  return equipoRepository.actualizar(id, datos);
}

async function eliminarEquipo(id, usuario) {
  exigirAdministrador(usuario);
  await equipoPorId(id);
  if (await prestamoRepository.contarActivosPorEquipo(id) > 0) {
    throw error(409, 'El equipo tiene préstamos activos y no puede eliminarse');
  }
  await equipoRepository.eliminar(id);
}

module.exports = { registrarEquipo, listarEquipos, equipoPorId, actualizarEquipo, eliminarEquipo };
