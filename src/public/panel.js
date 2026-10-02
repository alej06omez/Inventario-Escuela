// Compartido por panel-admin.html y panel-profesor.html.
const esAdmin = document.body.dataset.rol === 'administrador';
const aviso = document.getElementById('aviso');
const avisos = { creado: 'Equipo creado.', actualizado: 'Equipo actualizado.', prestado: 'Préstamo añadido.' };
aviso.textContent = avisos[new URLSearchParams(location.search).get('aviso')] || '';

document.getElementById('salir').addEventListener('click', async () => {
  await fetch('/usuarios/logout', { method: 'POST' });
  location.href = '/usuarios/login';
});

// Envía la acción de un botón: recarga el panel si sale bien o muestra el error.
async function accion(ruta, metodo) {
  const respuesta = await fetch(ruta, { method: metodo });
  if (respuesta.ok) return (location.href = '/panel');
  aviso.textContent = (await respuesta.json()).errores.join('. ');
}

function boton(texto, alPulsar) {
  const elemento = document.createElement('button');
  elemento.textContent = texto;
  elemento.addEventListener('click', alPulsar);
  return elemento;
}

fetch('/equipos').then(async (respuesta) => {
  if (respuesta.status === 401) return (location.href = '/usuarios/login');
  const cuerpo = document.querySelector('#equipos tbody');
  for (const equipo of await respuesta.json()) {
    const fila = cuerpo.insertRow();
    for (const campo of ['nombre', 'concepto', 'cantidad', 'descripcion']) {
      fila.insertCell().textContent = equipo[campo] ?? '';
    }
    if (esAdmin) {
      const enlace = document.createElement('a');
      enlace.href = `/equipos/${equipo.id}/editar`;
      enlace.textContent = 'Editar';
      fila.insertCell().append(enlace, ' ', boton('Eliminar', () => {
        if (confirm(`¿Eliminar "${equipo.nombre}"?`)) accion(`/equipos/${equipo.id}`, 'DELETE');
      }));
    }
  }
});

fetch('/prestamos').then(async (respuesta) => {
  if (!respuesta.ok) return;
  const cuerpo = document.querySelector('#prestamos tbody');
  for (const prestamo of await respuesta.json()) {
    const fila = cuerpo.insertRow();
    fila.insertCell().textContent = prestamo.suEquipo.nombre;
    fila.insertCell().textContent = prestamo.suUsuario.map((usuario) => usuario.nombre).join(', ');
    fila.insertCell().textContent = prestamo.fechaInicio;
    fila.insertCell().textContent = prestamo.horaInicio;
    fila.insertCell().append(boton('Concluir', () => accion(`/prestamos/${prestamo.id}/concluir`, 'POST')));
  }
});
