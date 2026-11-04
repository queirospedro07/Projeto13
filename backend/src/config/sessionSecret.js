const fs = require('node:fs');
const caminho = require('node:path');
const { randomBytes } = require('node:crypto');

require('./environment.js');

const { obterDadosDiretorio } = require('./storage.js');

function obterSegredoSessao() {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured || process.env.NODE_ENV === 'production') return configured;
  const filename = caminho.join(obterDadosDiretorio(), '.session-secret');

  fs.mkdirSync(caminho.dirname(filename), {
    recursive: true,
  });
  try {
    fs.writeFileSync(filename, randomBytes(48).toString('hex'), {
      flag: 'wx',
      mode: 0o600,
    });
  } catch (erro) {
    if (erro.code !== 'EEXIST') throw erro;
  }

  const segredo = fs.readFileSync(filename, 'utf8').trim();
  if (segredo.length < 32)
    throw new Error('A chave de sessão local está inválida. Configure JWT_SECRET.');

  return segredo;
}

exports.obterSegredoSessao = obterSegredoSessao;
