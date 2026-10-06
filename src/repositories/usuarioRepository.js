const { Usuario } = require('../models/Usuario');

function crear(usuario) {
  return usuario.save();
}

function buscarPorCorreo(correo) {
  return Usuario.findOne({ correo });
}

function buscarPorId(id) {
  return Usuario.findById(id);
}

async function existeAdministrador() {
  return Boolean(await Usuario.exists({ rol: 'administrador' }));
}

// null cierra la sesión.
function guardarSesion(id, sesionId) {
  return Usuario.updateOne({ _id: id }, { sesionActiva: sesionId });
}

function listarProfesores() {
  return Usuario.find({ rol: 'profesor' }).sort({ nombre: 1 });
}

module.exports = { crear, buscarPorCorreo, buscarPorId, existeAdministrador, guardarSesion, listarProfesores };
