// Error con código HTTP; el manejador de errores de app.js lo convierte en respuesta.
module.exports = (estado, mensaje) => Object.assign(new Error(mensaje), { estado });
