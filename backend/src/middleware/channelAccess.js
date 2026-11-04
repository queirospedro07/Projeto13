const { consultarUm } = require('../database/connection.js');
const { podeAcessoEspaco } = require('../services/courseAccess.js');

async function podeAcessoCanal(utilizador, canalId) {
  if (typeof canalId !== 'string' || !utilizador?.id) return false;
  const canal = await consultarUm('SELECT "idEspaco" FROM consulta_canais WHERE id = $1', [
    canalId,
  ]);

  return Boolean(canal && (await podeAcessoEspaco(utilizador, canal.idEspaco)));
}

exports.podeAcessoCanal = podeAcessoCanal;
