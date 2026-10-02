const db = require('../db');
const Prestamo = require('../models/Prestamo');

// ponytail: un usuario por préstamo. Si un préstamo llega a tener varios,
// agrupar las filas por p.id para armar suUsuario.
const CONSULTA = `
  SELECT p.id, p.fecha_inicio, p.hora_inicio, p.fecha_fin, p.hora_fin,
         e.id AS equipo_id, e.nombre AS equipo,
         u.id AS usuario_id, u.nombre AS usuario
  FROM prestamos p
  JOIN equipos e ON e.id = p.equipo_id
  JOIN prestamo_usuarios pu ON pu.prestamo_id = p.id
  JOIN usuarios u ON u.id = pu.usuario_id`;

const desdeFila = (fila) =>
  fila
    ? new Prestamo({
        id: fila.id,
        fechaInicio: fila.fecha_inicio,
        horaInicio: fila.hora_inicio,
        fechaFin: fila.fecha_fin,
        horaFin: fila.hora_fin,
        suEquipo: { id: fila.equipo_id, nombre: fila.equipo },
        suUsuario: [{ id: fila.usuario_id, nombre: fila.usuario }],
      })
    : null;

function crear(equipoId, usuarioId, { fecha, hora }) {
  const id = db.transaccion(() => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO prestamos (fecha_inicio, hora_inicio, equipo_id) VALUES (?, ?, ?)')
      .run(fecha, hora, equipoId);
    db.prepare('INSERT INTO prestamo_usuarios (prestamo_id, usuario_id) VALUES (?, ?)').run(lastInsertRowid, usuarioId);
    return Number(lastInsertRowid);
  });
  return buscarPorId(id);
}

function buscarPorId(id) {
  return desdeFila(db.prepare(`${CONSULTA} WHERE p.id = ?`).get(id));
}

// Préstamos activos; con usuarioId, solo los de ese usuario.
function activos(usuarioId) {
  const filtro = usuarioId ? 'AND u.id = ?' : '';
  return db
    .prepare(`${CONSULTA} WHERE p.fecha_fin IS NULL ${filtro} ORDER BY p.fecha_inicio, p.hora_inicio`)
    .all(...(usuarioId ? [usuarioId] : []))
    .map(desdeFila);
}

function contarActivosPorEquipo(equipoId) {
  return db.prepare('SELECT COUNT(*) AS total FROM prestamos WHERE equipo_id = ? AND fecha_fin IS NULL').get(equipoId).total;
}

function concluir(id, { fecha, hora }) {
  db.prepare('UPDATE prestamos SET fecha_fin = ?, hora_fin = ? WHERE id = ?').run(fecha, hora, id);
  return buscarPorId(id);
}

module.exports = { crear, buscarPorId, activos, contarActivosPorEquipo, concluir };
