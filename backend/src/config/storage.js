const caminho = require('node:path');

function obterDadosDiretorio() {
  const root = caminho.resolve(__dirname, '../..');

  return caminho.resolve(root, process.env.DATA_DIRECTORY || 'data');
}

exports.obterDadosDiretorio = obterDadosDiretorio;
