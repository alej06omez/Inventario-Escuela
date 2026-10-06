const Prestamo = require('../models/Prestamo');
const Multa = require('../models/Multa');

// Del equipo y de los usuarios solo se devuelve id y nombre.
const conRelaciones = (consulta) => consulta.populate('suEquipo', 'nombre').populate('suUsuario', 'nombre');

async function crear(equipoId, usuarioId, { fecha, hora }, diasPrestamo, fechaEsperada) {
  const { id } = await Prestamo.create({
    fechaInicio: fecha,
    horaInicio: hora,
    diasPrestamo,
    fechaEsperada,
    suEquipo: equipoId,
    suUsuario: [usuarioId],
  });
  return buscarPorId(id);
}

function buscarPorId(id) {
  return conRelaciones(Prestamo.findById(id));
}

// Préstamos activos; con usuarioId, solo los de ese usuario.
function activos(usuarioId) {
  const filtro = { fechaFin: null, ...(usuarioId && { suUsuario: usuarioId }) };
  return conRelaciones(Prestamo.find(filtro).sort({ fechaInicio: 1, horaInicio: 1 }));
}

function contarActivosPorEquipo(equipoId) {
  return Prestamo.countDocuments({ suEquipo: equipoId, fechaFin: null });
}

// Con días de retraso, el cierre genera su multa.
// ponytail: sin transacción (requiere replica set); usar session.withTransaction() al pasar a replica set.
async function concluir(id, { fecha, hora }, diasRetraso) {
  await Prestamo.updateOne({ _id: id }, { fechaFin: fecha, horaFin: hora, diasRetraso });
  if (diasRetraso > 0) await Multa.create({ fecha, suPrestamo: id });
  return buscarPorId(id);
}

module.exports = { crear, buscarPorId, activos, contarActivosPorEquipo, concluir };
