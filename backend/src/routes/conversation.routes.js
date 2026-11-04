const { Router } = require('express');
const { autenticar: autenticar } = require('../middleware/authentication.js');
const {
  obterConversaCanaisPorCanalIdMensagens,
  enviarConversaCanaisPorCanalIdMensagens,
  enviarConversaMensagensPorMensagemIdAfixar,
  enviarConversaMensagensPorMensagemIdResolver,
} = require('../controllers/conversation.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
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
