function facturar(monto, medioPago) {
  let descuento = 0;

  if (monto < 150000) {
    descuento = 0;
  } else if (monto >= 150000 && monto <= 300000) {
    if (medioPago === "E") {
      descuento = 0.25; 
    } else if (medioPago === "D") {
      descuento = 0.20; 
    } else if (medioPago === "C") {
      descuento = 0.15; 
    }
  } else if (monto > 300000) {

    descuento = 0.35;
  }


  let montoFinal = monto - (monto * descuento);
  return montoFinal;
}