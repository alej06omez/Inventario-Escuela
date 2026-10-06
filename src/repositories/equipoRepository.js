const Equipo = require('../models/Equipo');
const Prestamo = require('../models/Prestamo');
const Multa = require('../models/Multa');

function crear(datos) {
  return Equipo.create(datos);
}

function listar() {
  return Equipo.find().sort({ nombre: 1 });
}

function buscarPorId(id) {
  return Equipo.findById(id);
}

function actualizar(id, datos) {
  return Equipo.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
}

// Los préstamos ya concluidos (y sus multas) se borran con el equipo; los
// activos los bloquea antes el servicio.
// ponytail: sin transacción (requiere replica set). Si falla a mitad quedan
// préstamos huérfanos; usar session.withTransaction() al pasar a replica set.
async function eliminar(id) {
  const prestamos = await Prestamo.find({ suEquipo: id }).distinct('_id');
  await Multa.deleteMany({ suPrestamo: { $in: prestamos } });
  await Prestamo.deleteMany({ suEquipo: id });
  await Equipo.findByIdAndDelete(id);
}

module.exports = { crear, listar, buscarPorId, actualizar, eliminar };
