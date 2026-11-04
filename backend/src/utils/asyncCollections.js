async function assincronoMap(itens, funcaoRetorno) {
  const resultado = [];
  for (let indice = 0; indice < itens.length; indice++)
    resultado.push(await funcaoRetorno(itens[indice], indice, itens));

  return resultado;
}

async function assincronoFiltrar(itens, funcaoRetorno) {
  const resultado = [];
  for (let indice = 0; indice < itens.length; indice++)
    if (await funcaoRetorno(itens[indice], indice, itens)) resultado.push(itens[indice]);

  return resultado;
}

async function assincronoAlgum(itens, funcaoRetorno) {
  for (let indice = 0; indice < itens.length; indice++)
    if (await funcaoRetorno(itens[indice], indice, itens)) return true;

  return false;
}

async function assincronoTodos(itens, funcaoRetorno) {
  for (let indice = 0; indice < itens.length; indice++)
    if (!(await funcaoRetorno(itens[indice], indice, itens))) return false;

  return true;
}

async function assincronoParaCada(itens, funcaoRetorno) {
  await assincronoMap(itens, funcaoRetorno);
}

exports.assincronoMap = assincronoMap;
exports.assincronoFiltrar = assincronoFiltrar;
exports.assincronoAlgum = assincronoAlgum;
exports.assincronoTodos = assincronoTodos;
exports.assincronoParaCada = assincronoParaCada;
