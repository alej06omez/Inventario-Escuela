const path = require('node:path');
const equipoService = require('../services/equipoService');

const FORMULARIO = path.join(__dirname, '..', 'views', 'equipo-form.html');

function formularioRegistro(req, res) {
  res.sendFile(FORMULARIO);
}

// Solo entrega el formulario de edición si el equipo existe (404 si no).
function formularioEditar(req, res) {
  equipoService.equipoPorId(req.id);
  res.sendFile(FORMULARIO);
}

function registrar(req, res) {
  res.status(201).json(equipoService.registrarEquipo(req.datos, req.usuario));
}

function listar(req, res) {
  res.json(equipoService.listarEquipos());
}

function equipoPorId(req, res) {
  res.json(equipoService.equipoPorId(req.id));
}

function actualizar(req, res) {
  res.json(equipoService.actualizarEquipo(req.id, req.datos, req.usuario));
}

function eliminar(req, res) {
  equipoService.eliminarEquipo(req.id, req.usuario);
  res.status(204).end();
}

module.exports = { formularioRegistro, formularioEditar, registrar, listar, equipoPorId, actualizar, eliminar };
