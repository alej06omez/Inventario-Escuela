const { Schema, model } = require('mongoose');

const VALOR_POR_DIA = 1000;

const multaSchema = new Schema({
  fecha: { type: String, required: true },
  estado: { type: String, enum: ['pagado', 'no pago'], default: 'no pago' },
  suPrestamo: { type: Schema.Types.ObjectId, ref: 'Prestamo', required: true },
});

// Requiere suPrestamo poblado (populate) para leer sus días de retraso.
multaSchema.methods.diasRetraso = function () {
  return this.suPrestamo.diasRetraso;
};

multaSchema.methods.valorMulta = function () {
  return this.diasRetraso() * VALOR_POR_DIA;
};

module.exports = model('Multa', multaSchema);
