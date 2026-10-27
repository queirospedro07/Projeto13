const { Router } = require('express');
const {
  autenticar: autenticar,
  autenticacaoOpcional: opcionalAutenticacao,
} = require('../intermediarios/autenticacao.js');
const {
  enviarEspacoPorIdCanais,
  atualizarEspacoPorIdCanaisPorCanalId,
  eliminarEspacoPorIdCanaisPorCanalId,
  obterEspaco,
  obterEspacoPorId,
  enviarEspacoPorIdAderir,
} = require('../controladores/espaco.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');

function canalBody(pedido, resposta, seguinte) {
  const body = pedido.body;
  if (
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    body.name.length > 80 ||
    !['text', 'voice', 'announcement', 'qa', 'project'].includes(body.type) ||
    (body.topic != null && (typeof body.topic !== 'string' || body.topic.length > 1000)) ||
    (body.perguntaOrientadora != null &&
      (typeof body.perguntaOrientadora !== 'string' || body.perguntaOrientadora.length > 2000))
  )
    return resposta.status(400).json({
      error: 'Dados de canal inválidos.',
    });

  return seguinte();
}

const router = Router();

router.post(
  ['/:id/canais', '/:id/channels'],
  autenticar,
  canalBody,
  assincronoTratador(enviarEspacoPorIdCanais),
);
router.put(
  ['/:id/canais/:idCanal', '/:id/channels/:idCanal'],
  autenticar,
  canalBody,
  assincronoTratador(atualizarEspacoPorIdCanaisPorCanalId),
);
router.delete(
  ['/:id/canais/:idCanal', '/:id/channels/:idCanal'],
  autenticar,
  assincronoTratador(eliminarEspacoPorIdCanaisPorCanalId),
);
router.get('/', opcionalAutenticacao, assincronoTratador(obterEspaco));
router.get('/:id', opcionalAutenticacao, assincronoTratador(obterEspacoPorId));
router.post(['/:id/aderir', '/:id/join'], autenticar, assincronoTratador(enviarEspacoPorIdAderir));
module.exports = router;
