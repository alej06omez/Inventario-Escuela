const db = require('../db');
const Prestamo = require('../models/Prestamo');

// ponytail: un usuario por préstamo. Si un préstamo llega a tener varios,
// agrupar las filas por p.id para armar suUsuario.
const CONSULTA = `
  SELECT p.id, p.fecha_inicio, p.hora_inicio, p.fecha_fin, p.hora_fin,
         p.dias_prestamo, p.fecha_esperada, p.dias_retraso,
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
        diasPrestamo: fila.dias_prestamo,
        fechaEsperada: fila.fecha_esperada,
        diasRetraso: fila.dias_retraso,
        suEquipo: { id: fila.equipo_id, nombre: fila.equipo },
        suUsuario: [{ id: fila.usuario_id, nombre: fila.usuario }],
      })
    : null;

function crear(equipoId, usuarioId, { fecha, hora }, diasPrestamo, fechaEsperada) {
  const id = db.transaccion(() => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO prestamos (fecha_inicio, hora_inicio, equipo_id, dias_prestamo, fecha_esperada) VALUES (?, ?, ?, ?, ?)')
      .run(fecha, hora, equipoId, diasPrestamo, fechaEsperada);
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

// Con días de retraso, el cierre y su multa se guardan juntos.
function concluir(id, { fecha, hora }, diasRetraso) {
  db.transaccion(() => {
    db.prepare('UPDATE prestamos SET fecha_fin = ?, hora_fin = ?, dias_retraso = ? WHERE id = ?').run(fecha, hora, diasRetraso, id);
    if (diasRetraso > 0) db.prepare('INSERT INTO multas (fecha, prestamo_id) VALUES (?, ?)').run(fecha, id);
  });
  return buscarPorId(id);
}

module.exports = { crear, buscarPorId, activos, contarActivosPorEquipo, concluir };
