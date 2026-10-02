class Usuario {
  constructor({ id, nombre, institucion, correo, contrasena, telefono }) {
    this.id = id;
    this.nombre = nombre;
    this.institucion = institucion;
    this.correo = correo;
    this.contrasena = contrasena;
    this.telefono = telefono;
  }

  // La contraseña (hash) nunca sale en una respuesta JSON.
  toJSON() {
    const { contrasena, ...publico } = this;
    return publico;
  }
}

class Administrador extends Usuario {
  constructor(datos) {
    super(datos);
    this.rol = 'administrador';
    this.codigo = datos.codigo;
    this.area = datos.area;
    this.departamento = datos.departamento;
  }
}

class Profesor extends Usuario {
  constructor(datos) {
    super(datos);
    this.rol = 'profesor';
    this.sede = datos.sede;
    this.jornada = datos.jornada;
    this.materias = datos.materias || [];
  }
}

module.exports = { Usuario, Administrador, Profesor };
