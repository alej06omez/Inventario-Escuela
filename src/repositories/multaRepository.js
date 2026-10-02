const db = require('../db');
const Multa = require('../models/Multa');

function noPagasPorUsuario(usuarioId) {
  return db
    .prepare(
      `SELECT m.id, m.fecha, m.estado, p.id AS prestamo_id, p.dias_retraso
       FROM multas m
       JOIN prestamos p ON p.id = m.prestamo_id
       JOIN prestamo_usuarios pu ON pu.prestamo_id = p.id
       WHERE pu.usuario_id = ? AND m.estado = 'no pago'`
    )
    .all(usuarioId)
    .map((fila) => new Multa({
      id: fila.id,
      fecha: fila.fecha,
      estado: fila.estado,
      suPrestamo: { id: fila.prestamo_id, diasRetraso: fila.dias_retraso },
    }));
}

module.exports = { noPagasPorUsuario };
