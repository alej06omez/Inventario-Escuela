class Equipo {
  constructor({ id, nombre, concepto, cantidad, descripcion, suPrestamo = [] }) {
    this.id = id;
    this.nombre = nombre;
    this.concepto = concepto;
    this.cantidad = cantidad;
    this.descripcion = descripcion;
    this.suPrestamo = suPrestamo;
  }
}

module.exports = Equipo;
