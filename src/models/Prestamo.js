const { Schema, model } = require('mongoose');

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// fechaFin en null significa préstamo activo.
const prestamoSchema = new Schema({
  fechaInicio: { type: String, required: true },
  horaInicio: { type: String, required: true },
  fechaFin: { type: String, default: null },
  horaFin: { type: String, default: null },
  diasPrestamo: { type: Number, default: null },
  fechaEsperada: { type: String, default: null },
  diasRetraso: { type: Number, default: 0 },
  suEquipo: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  suUsuario: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
});

// Fecha 'AAAA-MM-DD' que resulta de sumar los días de préstamo a la de inicio.
prestamoSchema.statics.fechaEsperadaDesde = function (fechaInicio, diasPrestamo) {
  return new Date(Date.parse(fechaInicio) + diasPrestamo * MS_POR_DIA).toISOString().slice(0, 10);
};

// Días entre la fecha esperada y la de retorno; 0 si se devolvió a tiempo.
prestamoSchema.methods.calcularDiasRetraso = function (fechaRetorno) {
  if (!this.fechaEsperada) return 0;
  return Math.max(0, Math.round((Date.parse(fechaRetorno) - Date.parse(this.fechaEsperada)) / MS_POR_DIA));
};

module.exports = model('Prestamo', prestamoSchema);
