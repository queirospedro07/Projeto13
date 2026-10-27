const assincronoTratador = (tratador) => (pedido, resposta, seguinte) =>
  Promise.resolve(tratador(pedido, resposta, seguinte)).catch(seguinte);

exports.assincronoTratador = assincronoTratador;
