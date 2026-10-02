const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(process.env.DB_PATH || 'inventario.db');

// Administrador y Profesor comparten la tabla usuarios; "rol" indica el subtipo
// y las columnas del otro subtipo quedan en NULL.
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS usuarios (
    id           INTEGER PRIMARY KEY,
    rol          TEXT NOT NULL CHECK (rol IN ('administrador', 'profesor')),
    nombre       TEXT NOT NULL,
    institucion  TEXT NOT NULL,
    correo       TEXT NOT NULL UNIQUE,
    contrasena   TEXT NOT NULL,
    telefono     TEXT NOT NULL,
    codigo       TEXT,
    area         TEXT,
    departamento TEXT,
    sede         TEXT,
    jornada      TEXT,
    materias     TEXT
  );

  CREATE TABLE IF NOT EXISTS equipos (
    id          INTEGER PRIMARY KEY,
    nombre      TEXT NOT NULL,
    concepto    TEXT NOT NULL,
    cantidad    INTEGER NOT NULL CHECK (cantidad >= 0),
    descripcion TEXT
  );

  CREATE TABLE IF NOT EXISTS prestamos (
    id           INTEGER PRIMARY KEY,
    fecha_inicio TEXT NOT NULL,
    hora_inicio  TEXT NOT NULL,
    fecha_fin    TEXT,
    hora_fin     TEXT,
    equipo_id    INTEGER NOT NULL REFERENCES equipos(id)
  );

  CREATE TABLE IF NOT EXISTS prestamo_usuarios (
    prestamo_id INTEGER NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
    PRIMARY KEY (prestamo_id, usuario_id)
  );
`);

// fecha_fin en NULL significa préstamo activo.
// Migración de bases creadas con el esquema anterior (fecha, hora, concluido).
const columnas = db.prepare("SELECT name FROM pragma_table_info('prestamos')").all().map((columna) => columna.name);
if (columnas.includes('fecha')) {
  db.exec(`
    ALTER TABLE prestamos RENAME COLUMN fecha TO fecha_inicio;
    ALTER TABLE prestamos RENAME COLUMN hora TO hora_inicio;
    ALTER TABLE prestamos ADD COLUMN fecha_fin TEXT;
    ALTER TABLE prestamos ADD COLUMN hora_fin TEXT;
  `);
  if (columnas.includes('concluido')) {
    db.exec(`
      UPDATE prestamos SET fecha_fin = substr(concluido, 1, 10), hora_fin = substr(concluido, 12);
      ALTER TABLE prestamos DROP COLUMN concluido;
    `);
  }
}

// Ejecuta la función en una transacción: o se guarda todo o nada.
db.transaccion = (funcion) => {
  db.exec('BEGIN');
  try {
    const resultado = funcion();
    db.exec('COMMIT');
    return resultado;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

module.exports = db;
