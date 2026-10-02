const path = require('node:path');

// Carga TOKEN_SECRET y demás variables antes de que los servicios las lean.
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const express = require('express');
const { autenticar, requiereSesion, paginaConSesion, soloAdministrador, permisoRegistro } = require('./middleware/auth');
const { validarRegistro, validarLogin } = require('./validators/usuarioValidator');
const { validarId, validarEquipo } = require('./validators/equipoValidator');
const usuarioController = require('./controllers/usuarioController');
const { validarPrestamo } = require('./validators/prestamoValidator');
const equipoController = require('./controllers/equipoController');
const prestamoController = require('./controllers/prestamoController');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(autenticar);

app.get('/', (req, res) => res.redirect('/panel'));
app.get('/panel', paginaConSesion, usuarioController.panel);

app.get('/usuarios/registro', usuarioController.formularioRegistro);
app.post('/usuarios/registro', permisoRegistro, validarRegistro, usuarioController.registrar);
app.get('/usuarios/login', usuarioController.formularioLogin);
app.post('/usuarios/login', validarLogin, usuarioController.login);
app.post('/usuarios/logout', usuarioController.logout);

app.get('/equipos/registro', paginaConSesion, soloAdministrador, equipoController.formularioRegistro);
app.get('/equipos/:id/editar', paginaConSesion, soloAdministrador, validarId, equipoController.formularioEditar);
app.get('/equipos', requiereSesion, equipoController.listar);
app.post('/equipos', requiereSesion, validarEquipo, equipoController.registrar);
app.get('/equipos/:id', requiereSesion, validarId, equipoController.equipoPorId);
app.put('/equipos/:id', requiereSesion, soloAdministrador, validarId, validarEquipo, equipoController.actualizar);
app.delete('/equipos/:id', requiereSesion, soloAdministrador, validarId, equipoController.eliminar);

app.get('/prestamos/registro', paginaConSesion, prestamoController.formularioRegistro);
app.get('/prestamos', requiereSesion, prestamoController.listar);
app.post('/prestamos', requiereSesion, validarPrestamo, prestamoController.anadir);
app.post('/prestamos/:id/concluir', requiereSesion, validarId, prestamoController.concluir);

app.use((error, req, res, next) => {
  // error.status lo pone express.json() cuando el JSON llega mal formado.
  const estado = error.estado || error.status || 500;
  if (estado === 500) console.error(error);
  res.status(estado).json({ errores: [estado === 500 ? 'Error interno del servidor' : error.message] });
});

if (require.main === module) {
  const puerto = process.env.PORT || 2888;
  app.listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`));
}

module.exports = app;
