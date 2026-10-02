class Prestamo {
  constructor({ id, fechaInicio, horaInicio, fechaFin = null, horaFin = null, suEquipo, suUsuario = [] }) {
    this.id = id;
    this.fechaInicio = fechaInicio;
    this.horaInicio = horaInicio;
    this.fechaFin = fechaFin;
    this.horaFin = horaFin;
    this.suEquipo = suEquipo;
    this.suUsuario = suUsuario;
  }
}

module.exports = Prestamo;
