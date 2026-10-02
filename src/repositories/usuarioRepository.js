const db = require('../db');
const { Administrador, Profesor } = require('../models/Usuario');

function desdeFila(fila) {
  if (!fila) return null;
  return fila.rol === 'administrador'
    ? new Administrador(fila)
    : new Profesor({ ...fila, materias: JSON.parse(fila.materias || '[]') });
}

function crear(usuario) {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO usuarios
         (rol, nombre, institucion, correo, contrasena, telefono,
          codigo, area, departamento, sede, jornada, materias)
       VALUES
         (:rol, :nombre, :institucion, :correo, :contrasena, :telefono,
          :codigo, :area, :departamento, :sede, :jornada, :materias)`
    )
    .run({
      rol: usuario.rol,
      nombre: usuario.nombre,
      institucion: usuario.institucion,
      correo: usuario.correo,
      contrasena: usuario.contrasena,
      telefono: usuario.telefono,
      codigo: usuario.codigo ?? null,
      area: usuario.area ?? null,
      departamento: usuario.departamento ?? null,
      sede: usuario.sede ?? null,
      jornada: usuario.jornada ?? null,
      materias: usuario.materias ? JSON.stringify(usuario.materias) : null,
    });
  usuario.id = Number(lastInsertRowid);
  return usuario;
}

function buscarPorCorreo(correo) {
  return desdeFila(db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo));
}

function buscarPorId(id) {
  return desdeFila(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id));
}

function existeAdministrador() {
  return Boolean(db.prepare("SELECT 1 FROM usuarios WHERE rol = 'administrador' LIMIT 1").get());
}

function listarProfesores() {
  return db.prepare("SELECT * FROM usuarios WHERE rol = 'profesor' ORDER BY nombre").all().map(desdeFila);
}

module.exports = { crear, buscarPorCorreo, buscarPorId, existeAdministrador, listarProfesores };
