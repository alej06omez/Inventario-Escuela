const path = require('node:path');
const prestamoService = require('../services/prestamoService');

function formularioRegistro(req, res) {
  res.sendFile(path.join(__dirname, '..', 'views', 'prestamo-form.html'));
}

function listar(req, res) {
  res.json(prestamoService.listarPrestamos(req.usuario));
}

// El préstamo queda a nombre del usuario de la sesión.
function anadir(req, res) {
  res.status(201).json(prestamoService.anadirPrestamoPorIdUsuario(req.datos.equipoId, req.usuario.id));
}

function concluir(req, res) {
  res.json(prestamoService.concluirPrestamo(req.id, req.usuario));
}

module.exports = { formularioRegistro, listar, anadir, concluir };
