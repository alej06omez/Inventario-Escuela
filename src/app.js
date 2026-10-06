const path = require('node:path');

// Carga TOKEN_SECRET y demás variables antes de que los servicios las lean.
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const express = require('express');
const { conectar } = require('./database');
const { autenticar, requiereSesion, paginaConSesion, soloAdministrador, permisoRegistro, destinatarioPrestamo } = require('./middleware/auth');
const { validarRegistro, validarLogin, validarConsultaMultas } = require('./validators/usuarioValidator');
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
app.get('/prestamos/profesor', paginaConSesion, soloAdministrador, prestamoController.formularioProfesor);
app.post('/prestamos', requiereSesion, validarPrestamo, destinatarioPrestamo, prestamoController.anadir);
app.get('/usuarios/profesores', requiereSesion, soloAdministrador, usuarioController.listarProfesores);
app.get('/multas/valor', requiereSesion, validarConsultaMultas, usuarioController.verificarValorMultas);
app.post('/prestamos/:id/concluir', requiereSesion, validarId, prestamoController.concluir);

app.use((error, req, res, next) => {
  // error.status lo pone express.json() cuando el JSON llega mal formado.
  const estado = error.estado || error.status || 500;
  if (estado === 500) console.error(error);
  res.status(estado).json({ errores: [estado === 500 ? 'Error interno del servidor' : error.message] });
});

if (require.main === module) {
  const puerto = process.env.PORT || 2888;
  // El servidor solo acepta peticiones con la base de datos ya conectada.
  conectar()
    .then(() => app.listen(puerto, () => console.log(`Servidor en http://localhost:${puerto}`)))
    .catch((error) => {
      console.error('No se pudo conectar a MongoDB:', error.message);
      process.exit(1);
    });
}

module.exports = app;
