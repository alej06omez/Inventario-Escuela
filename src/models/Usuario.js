const { Schema, model } = require('mongoose');

// Administrador y Profesor comparten la colección usuarios; "rol" indica el subtipo.
const usuarioSchema = new Schema(
  {
    nombre: { type: String, required: true },
    institucion: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    contrasena: { type: String, required: true },
    telefono: { type: String, required: true },
    // Id de la única sesión válida: iniciar sesión en otro dispositivo la reemplaza.
    sesionActiva: { type: String, default: null },
  },
  {
    discriminatorKey: 'rol',
    // La contraseña (hash) y la sesión nunca salen en una respuesta JSON.
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (documento, json) => {
        delete json._id;
        delete json.contrasena;
        delete json.sesionActiva;
      },
    },
  }
);

const Usuario = model('Usuario', usuarioSchema);

const Administrador = Usuario.discriminator('administrador', new Schema({
  codigo: { type: String, required: true },
  area: { type: String, required: true },
  departamento: { type: String, required: true },
}));

const profesorSchema = new Schema({
  sede: { type: String, required: true },
  jornada: { type: String, required: true },
  materias: { type: [String], default: [] },
});

// Suma solo las multas sin pagar.
profesorSchema.methods.calcularMultasValor = function (susMultas) {
  return susMultas
    .filter((multa) => multa.estado === 'no pago')
    .reduce((total, multa) => total + multa.valorMulta(), 0);
};

const Profesor = Usuario.discriminator('profesor', profesorSchema);

module.exports = { Usuario, Administrador, Profesor };
