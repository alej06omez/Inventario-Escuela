const path = require('node:path');
const prestamoService = require('../services/prestamoService');

function formularioRegistro(req, res) {
  res.sendFile(path.join(__dirname, '..', 'views', 'prestamo-form.html'));
}

function listar(req, res) {
  res.json(prestamoService.listarPrestamos(req.usuario));
}

function formularioProfesor(req, res) {
  res.sendFile(path.join(__dirname, '..', 'views', 'prestamo-profesor-form.html'));
}

// Sin destinatario (administrador que aún no elige profesor) se responde con
// el formulario donde elegirlo; ese formulario reenvía el préstamo completo.
function anadir(req, res) {
  const { equipoId, diasPrestamo, usuarioId } = req.datos;
  if (!usuarioId) {
    return res.status(202).json({ formulario: `/prestamos/profesor?equipoId=${equipoId}&diasPrestamo=${diasPrestamo}` });
  }
  res.status(201).json(prestamoService.anadirPrestamoPorIdUsuario(equipoId, usuarioId, diasPrestamo));
}

function concluir(req, res) {
  res.json(prestamoService.concluirPrestamo(req.id, req.usuario));
}

module.exports = { formularioRegistro, formularioProfesor, listar, anadir, concluir };
