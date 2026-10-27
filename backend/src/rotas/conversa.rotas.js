const { Router } = require('express');
const { autenticar: autenticar } = require('../intermediarios/autenticacao.js');
const {
  obterConversaCanaisPorCanalIdMensagens,
  enviarConversaCanaisPorCanalIdMensagens,
  enviarConversaMensagensPorMensagemIdAfixar,
  enviarConversaMensagensPorMensagemIdResolver,
} = require('../controladores/conversa.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get(
  ['/canais/:idCanal/mensagens', '/channels/:idCanal/messages'],
  autenticar,
  assincronoTratador(obterConversaCanaisPorCanalIdMensagens),
);
router.post(
  ['/canais/:idCanal/mensagens', '/channels/:idCanal/messages'],
  autenticar,
  assincronoTratador(enviarConversaCanaisPorCanalIdMensagens),
);
router.post(
  ['/mensagens/:messageId/afixar', '/messages/:messageId/pin'],
  autenticar,
  assincronoTratador(enviarConversaMensagensPorMensagemIdAfixar),
);
router.post(
  ['/mensagens/:messageId/resolver', '/messages/:messageId/resolve'],
  autenticar,
  assincronoTratador(enviarConversaMensagensPorMensagemIdResolver),
);
module.exports = router;
