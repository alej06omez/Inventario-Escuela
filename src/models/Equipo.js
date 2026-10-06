const { Schema, model } = require('mongoose');

// Los préstamos guardan la referencia a su equipo; no se duplica aquí.
const equipoSchema = new Schema({
  nombre: { type: String, required: true },
  concepto: { type: String, required: true },
  cantidad: { type: Number, required: true, min: 0 },
  descripcion: { type: String, default: null },
});

module.exports = model('Equipo', equipoSchema);
