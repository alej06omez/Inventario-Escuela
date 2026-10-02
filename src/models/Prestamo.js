const MS_POR_DIA = 24 * 60 * 60 * 1000;

class Prestamo {
  constructor({
    id, fechaInicio, horaInicio, fechaFin = null, horaFin = null,
    diasPrestamo = null, fechaEsperada = null, diasRetraso = 0, suEquipo, suUsuario = [],
  }) {
    this.id = id;
    this.fechaInicio = fechaInicio;
    this.horaInicio = horaInicio;
    this.fechaFin = fechaFin;
    this.horaFin = horaFin;
    this.diasPrestamo = diasPrestamo;
    this.fechaEsperada = fechaEsperada;
    this.diasRetraso = diasRetraso;
    this.suEquipo = suEquipo;
    this.suUsuario = suUsuario;
  }

  // Fecha 'AAAA-MM-DD' que resulta de sumar los días de préstamo a la de inicio.
  static fechaEsperadaDesde(fechaInicio, diasPrestamo) {
    return new Date(Date.parse(fechaInicio) + diasPrestamo * MS_POR_DIA).toISOString().slice(0, 10);
  }

  // Días entre la fecha esperada y la de retorno; 0 si se devolvió a tiempo.
  calcularDiasRetraso(fechaRetorno) {
    if (!this.fechaEsperada) return 0;
    return Math.max(0, Math.round((Date.parse(fechaRetorno) - Date.parse(this.fechaEsperada)) / MS_POR_DIA));
  }
}

module.exports = Prestamo;
