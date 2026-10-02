const db = require('../db');
const Equipo = require('../models/Equipo');

const desdeFila = (fila) => (fila ? new Equipo(fila) : null);

function crear(datos) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO equipos (nombre, concepto, cantidad, descripcion) VALUES (?, ?, ?, ?)')
    .run(datos.nombre, datos.concepto, datos.cantidad, datos.descripcion);
  return buscarPorId(Number(lastInsertRowid));
}

function listar() {
  return db.prepare('SELECT * FROM equipos ORDER BY nombre').all().map(desdeFila);
}

function buscarPorId(id) {
  return desdeFila(db.prepare('SELECT * FROM equipos WHERE id = ?').get(id));
}

function actualizar(id, datos) {
  db.prepare('UPDATE equipos SET nombre = ?, concepto = ?, cantidad = ?, descripcion = ? WHERE id = ?')
    .run(datos.nombre, datos.concepto, datos.cantidad, datos.descripcion, id);
  return buscarPorId(id);
}

// Los préstamos ya concluidos se borran con el equipo (su clave foránea
// impediría el borrado); los activos los bloquea antes el servicio.
function eliminar(id) {
  db.transaccion(() => {
    db.prepare('DELETE FROM prestamos WHERE equipo_id = ?').run(id);
    db.prepare('DELETE FROM equipos WHERE id = ?').run(id);
  });
}

module.exports = { crear, listar, buscarPorId, actualizar, eliminar };
