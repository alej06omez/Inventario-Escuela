const Multa = require('../models/Multa');
const Prestamo = require('../models/Prestamo');

async function noPagasPorUsuario(usuarioId) {
  const prestamos = await Prestamo.find({ suUsuario: usuarioId }).distinct('_id');
  return Multa.find({ estado: 'no pago', suPrestamo: { $in: prestamos } }).populate('suPrestamo', 'diasRetraso');
}

module.exports = { noPagasPorUsuario };
