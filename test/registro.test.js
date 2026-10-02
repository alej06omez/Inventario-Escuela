process.env.DB_PATH = ':memory:';
process.env.TOKEN_SECRET = 'secreto-de-prueba';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let servidor;
let base;

before(async () => {
  servidor = app.listen(0);
  await new Promise((listo) => servidor.once('listening', listo));
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());

const post = async (ruta, cuerpo, token) => {
  const respuesta = await fetch(base + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(cuerpo),
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
};

const comunes = { nombre: 'Ana', institucion: 'Colegio', contrasena: 'secreta123', telefono: '3001234567' };
const admin = { ...comunes, rol: 'administrador', correo: 'admin@colegio.edu', codigo: 'A1', area: 'TI', departamento: 'Sistemas' };
const profesor = { ...comunes, rol: 'profesor', correo: 'profe@colegio.edu', sede: 'Norte', jornada: 'Mañana', materias: ['Física'] };

test('flujo de registro y login', async () => {
  const formulario = await fetch(`${base}/usuarios/registro`);
  assert.equal(formulario.status, 200);
  assert.match(await formulario.text(), /<form/);

  const primerAdmin = await post('/usuarios/registro', admin);
  assert.equal(primerAdmin.estado, 201);
  assert.equal(primerAdmin.cuerpo.rol, 'administrador');
  assert.equal(primerAdmin.cuerpo.contrasena, undefined);

  const otroAdmin = { ...admin, correo: 'admin2@colegio.edu' };
  assert.equal((await post('/usuarios/registro', otroAdmin)).estado, 403);
  assert.equal((await post('/usuarios/registro', otroAdmin, 'token.falso')).estado, 401);

  const profe = await post('/usuarios/registro', profesor);
  assert.equal(profe.estado, 201);
  assert.deepEqual(profe.cuerpo.materias, ['Física']);

  assert.equal((await post('/usuarios/registro', profesor)).estado, 409);

  const invalido = await post('/usuarios/registro', { ...profesor, correo: 'no-es-correo', materias: [] });
  assert.equal(invalido.estado, 400);
  assert.equal(invalido.cuerpo.errores.length, 2);

  assert.equal((await post('/usuarios/login', { correo: admin.correo, contrasena: 'incorrecta' })).estado, 401);

  const loginProfesor = await post('/usuarios/login', { correo: profesor.correo, contrasena: profesor.contrasena });
  assert.equal((await post('/usuarios/registro', otroAdmin, loginProfesor.cuerpo.token)).estado, 403);

  const loginAdmin = await post('/usuarios/login', { correo: admin.correo, contrasena: admin.contrasena });
  assert.equal(loginAdmin.estado, 200);
  assert.equal((await post('/usuarios/registro', otroAdmin, loginAdmin.cuerpo.token)).estado, 201);
});

test('panel por rol y gestión de equipos', async () => {
  const pedir = async (ruta, { metodo = 'GET', cuerpo, token, cookie } = {}) => {
    const respuesta = await fetch(base + ruta, {
      method: metodo,
      redirect: 'manual',
      headers: {
        ...(cuerpo && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(cookie && { Cookie: cookie }),
      },
      body: cuerpo && JSON.stringify(cuerpo),
    });
    const texto = await respuesta.text();
    return { estado: respuesta.status, texto, json: () => JSON.parse(texto), cabeceras: respuesta.headers };
  };
  const entrar = async (usuario) => {
    const respuesta = await pedir('/usuarios/login', {
      metodo: 'POST',
      cuerpo: { correo: usuario.correo, contrasena: usuario.contrasena },
    });
    const galleta = respuesta.cabeceras.get('set-cookie');
    assert.match(galleta, /HttpOnly/);
    return { token: respuesta.json().token, cookie: galleta.split(';')[0] };
  };
  const sesionAdmin = await entrar(admin);
  const sesionProfesor = await entrar(profesor);

  // Panel: sin sesión redirige al login; con sesión, la vista depende del rol.
  const anonimo = await pedir('/panel');
  assert.equal(anonimo.estado, 302);
  assert.equal(anonimo.cabeceras.get('location'), '/usuarios/login');
  assert.match((await pedir('/panel', { cookie: sesionAdmin.cookie })).texto, /data-rol="administrador"/);
  assert.match((await pedir('/panel', { cookie: sesionProfesor.cookie })).texto, /data-rol="profesor"/);
  assert.equal((await pedir('/panel', { cookie: 'token=manipulado.x' })).estado, 302);

  // Registro de equipo: solo administrador.
  const equipo = { nombre: 'Portátil Lenovo', concepto: 'Computador', cantidad: 5, descripcion: 'Sala 2' };
  assert.equal((await pedir('/equipos', { metodo: 'POST', cuerpo: equipo })).estado, 401);
  assert.equal((await pedir('/equipos', { metodo: 'POST', cuerpo: equipo, token: sesionProfesor.token })).estado, 403);
  assert.equal((await pedir('/equipos/registro', { cookie: sesionProfesor.cookie })).estado, 403);
  const invalido = await pedir('/equipos', { metodo: 'POST', cuerpo: { ...equipo, cantidad: -1 }, token: sesionAdmin.token });
  assert.equal(invalido.estado, 400);

  const creado = await pedir('/equipos', { metodo: 'POST', cuerpo: equipo, cookie: sesionAdmin.cookie });
  assert.equal(creado.estado, 201);
  const { id } = creado.json();

  // Consulta por id.
  assert.equal((await pedir(`/equipos/${id}`, { token: sesionProfesor.token })).json().nombre, equipo.nombre);
  assert.equal((await pedir('/equipos/999', { token: sesionAdmin.token })).estado, 404);
  assert.equal((await pedir('/equipos/abc', { token: sesionAdmin.token })).estado, 400);
  assert.equal((await pedir('/equipos/999/editar', { cookie: sesionAdmin.cookie })).estado, 404);
  assert.match((await pedir(`/equipos/${id}/editar`, { cookie: sesionAdmin.cookie })).texto, /<form/);

  // Actualización: solo administrador.
  const cambios = { ...equipo, cantidad: 3 };
  assert.equal((await pedir(`/equipos/${id}`, { metodo: 'PUT', cuerpo: cambios, token: sesionProfesor.token })).estado, 403);
  assert.equal((await pedir('/equipos/999', { metodo: 'PUT', cuerpo: cambios, token: sesionAdmin.token })).estado, 404);
  assert.equal((await pedir(`/equipos/${id}`, { metodo: 'PUT', cuerpo: cambios, token: sesionAdmin.token })).json().cantidad, 3);

  const lista = (await pedir('/equipos', { token: sesionProfesor.token })).json();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].cantidad, 3);
});

test('préstamos y eliminación de equipo', async () => {
  const entrar = async (usuario) =>
    (await post('/usuarios/login', { correo: usuario.correo, contrasena: usuario.contrasena })).cuerpo.token;
  const pedir = async (metodo, ruta, token, cuerpo) => {
    const respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: cuerpo && JSON.stringify(cuerpo),
    });
    const texto = await respuesta.text();
    return { estado: respuesta.status, cuerpo: texto && JSON.parse(texto) };
  };
  const tokenAdmin = await entrar(admin);
  const tokenProfesor = await entrar(profesor);
  const tokenOtro = await entrar({ ...admin, correo: 'admin2@colegio.edu' });

  const equipo = (await pedir('POST', '/equipos', tokenAdmin, { nombre: 'Proyector', concepto: 'Video', cantidad: 1 })).cuerpo;

  // Añadir préstamo: valida datos, equipo y unidades disponibles.
  assert.equal((await pedir('POST', '/prestamos', tokenProfesor, { equipoId: 'x' })).estado, 400);
  assert.equal((await pedir('POST', '/prestamos', tokenProfesor, { equipoId: 999, diasPrestamo: 2 })).estado, 404);
  assert.equal((await pedir('POST', '/prestamos', tokenProfesor, { equipoId: equipo.id })).estado, 400);
  const prestamo = await pedir('POST', '/prestamos', tokenProfesor, { equipoId: equipo.id, diasPrestamo: 2 });
  assert.equal(prestamo.estado, 201);
  assert.equal(prestamo.cuerpo.suEquipo.id, equipo.id);
  assert.equal(prestamo.cuerpo.suUsuario[0].nombre, profesor.nombre);
  assert.match(prestamo.cuerpo.fechaInicio, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(prestamo.cuerpo.horaInicio, /^\d{2}:\d{2}:\d{2}$/);
  assert.equal(prestamo.cuerpo.fechaFin, null);
  assert.equal(prestamo.cuerpo.diasPrestamo, 2);
  assert.equal(Date.parse(prestamo.cuerpo.fechaEsperada) - Date.parse(prestamo.cuerpo.fechaInicio), 2 * 24 * 60 * 60 * 1000);

  // El administrador debe elegir profesor: sin él recibe el formulario para elegirlo.
  const sinProfesor = await pedir('POST', '/prestamos', tokenAdmin, { equipoId: equipo.id, diasPrestamo: 2 });
  assert.equal(sinProfesor.estado, 202);
  assert.equal(sinProfesor.cuerpo.formulario, `/prestamos/profesor?equipoId=${equipo.id}&diasPrestamo=2`);
  const profesores = (await pedir('GET', '/usuarios/profesores', tokenAdmin)).cuerpo;
  assert.equal((await pedir('GET', '/usuarios/profesores', tokenProfesor)).estado, 403);
  const profesorId = profesores.find((uno) => uno.nombre === profesor.nombre).id;
  assert.equal((await pedir('POST', '/prestamos', tokenAdmin, { equipoId: equipo.id, diasPrestamo: 2, profesorId: 999 })).estado, 404);
  assert.equal((await pedir('POST', '/prestamos', tokenAdmin, { equipoId: equipo.id, diasPrestamo: 2, profesorId })).estado, 409);

  // Listado: el profesor ve los suyos; el administrador, todos.
  assert.equal((await pedir('GET', '/prestamos', tokenProfesor)).cuerpo.length, 1);
  assert.equal((await pedir('GET', '/prestamos', tokenAdmin)).cuerpo.length, 1);

  // Eliminar equipo: solo administrador y sin préstamos activos.
  assert.equal((await pedir('DELETE', `/equipos/${equipo.id}`, tokenProfesor)).estado, 403);
  assert.equal((await pedir('DELETE', `/equipos/${equipo.id}`, tokenAdmin)).estado, 409);

  // Concluir préstamo: su usuario o un administrador, una sola vez.
  const tokenAjeno = (await post('/usuarios/registro', { ...profesor, correo: 'profe2@colegio.edu' })).estado === 201
    && await entrar({ ...profesor, correo: 'profe2@colegio.edu' });
  assert.equal((await pedir('POST', `/prestamos/${prestamo.cuerpo.id}/concluir`, tokenAjeno)).estado, 403);
  assert.equal((await pedir('POST', '/prestamos/999/concluir', tokenAdmin)).estado, 404);
  const concluido = await pedir('POST', `/prestamos/${prestamo.cuerpo.id}/concluir`, tokenOtro);
  assert.equal(concluido.estado, 200);
  assert.match(concluido.cuerpo.fechaFin, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(concluido.cuerpo.horaFin, /^\d{2}:\d{2}:\d{2}$/);
  assert.equal((await pedir('POST', `/prestamos/${prestamo.cuerpo.id}/concluir`, tokenProfesor)).estado, 409);
  assert.equal((await pedir('GET', '/prestamos', tokenAdmin)).cuerpo.length, 0);
  assert.equal(concluido.cuerpo.diasRetraso, 0);

  // Multas: devolver tarde cobra 1000 por día de retraso; solo el profesor las consulta.
  assert.deepEqual((await pedir('GET', '/multas/valor', tokenProfesor)).cuerpo, { valor: 0 });
  assert.equal((await pedir('GET', '/multas/valor', tokenAdmin)).estado, 403);
  const tardio = await pedir('POST', '/prestamos', tokenAdmin, { equipoId: equipo.id, diasPrestamo: 1, profesorId });
  assert.equal(tardio.estado, 201);
  assert.equal(tardio.cuerpo.suUsuario[0].id, profesorId);
  require('../src/db').prepare("UPDATE prestamos SET fecha_esperada = date(fecha_esperada, '-4 days') WHERE id = ?").run(tardio.cuerpo.id);
  assert.equal((await pedir('POST', `/prestamos/${tardio.cuerpo.id}/concluir`, tokenProfesor)).cuerpo.diasRetraso, 3);
  assert.deepEqual((await pedir('GET', '/multas/valor', tokenProfesor)).cuerpo, { valor: 3000 });
  assert.deepEqual((await pedir('GET', '/multas/valor', tokenAjeno)).cuerpo, { valor: 0 });

  assert.equal((await pedir('DELETE', `/equipos/${equipo.id}`, tokenAdmin)).estado, 204);
  assert.equal((await pedir('GET', `/equipos/${equipo.id}`, tokenAdmin)).estado, 404);
});

test('formulario de préstamo para administrador y profesor', async () => {
  const anonimo = await fetch(`${base}/prestamos/registro`, { redirect: 'manual' });
  assert.equal(anonimo.status, 302);
  for (const usuario of [admin, profesor]) {
    const { token } = (await post('/usuarios/login', { correo: usuario.correo, contrasena: usuario.contrasena })).cuerpo;
    const pagina = await fetch(`${base}/prestamos/registro`, { headers: { Cookie: `token=${token}` } });
    assert.equal(pagina.status, 200);
    assert.match(await pagina.text(), /<select name="equipoId"/);
  }
});
