const VALOR_POR_DIA = 1000;

class Multa {
  constructor({ id, fecha, estado = 'no pago', suPrestamo }) {
    this.id = id;
    this.fecha = fecha;
    this.estado = estado;
    this.suPrestamo = suPrestamo;
  }

  diasRetraso() {
    return this.suPrestamo.diasRetraso;
  }

  valorMulta() {
    return this.diasRetraso() * VALOR_POR_DIA;
  }
}

module.exports = Multa;
