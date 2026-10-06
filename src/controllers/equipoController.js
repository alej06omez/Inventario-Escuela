const path = require('node:path');
const equipoService = require('../services/equipoService');

const FORMULARIO = path.join(__dirname, '..', 'views', 'equipo-form.html');

function formularioRegistro(req, res) {
  res.sendFile(FORMULARIO);
}

// Solo entrega el formulario de edición si el equipo existe (404 si no).
async function formularioEditar(req, res) {
  await equipoService.equipoPorId(req.id);
  res.sendFile(FORMULARIO);
}

async function registrar(req, res) {
  res.status(201).json(await equipoService.registrarEquipo(req.datos, req.usuario));
}

async function listar(req, res) {
  res.json(await equipoService.listarEquipos());
}

async function equipoPorId(req, res) {
  res.json(await equipoService.equipoPorId(req.id));
}

async function actualizar(req, res) {
  res.json(await equipoService.actualizarEquipo(req.id, req.datos, req.usuario));
}

async function eliminar(req, res) {
  await equipoService.eliminarEquipo(req.id, req.usuario);
  res.status(204).end();
}

module.exports = { formularioRegistro, formularioEditar, registrar, listar, equipoPorId, actualizar, eliminar };
