const { Router } = require('express');
const { autenticar: autenticar } = require('../middleware/authentication.js');
const {
  obterNotificacao,
  atualizarNotificacaoLerTodos,
  atualizarNotificacaoPorIdLer,
} = require('../controllers/notification.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
const router = Router();

router.get('/', autenticar, assincronoTratador(obterNotificacao));
router.put(
  ['/ler-todas', '/read-all'],
  autenticar,
  assincronoTratador(atualizarNotificacaoLerTodos),
);
router.put(['/:id/ler', '/:id/read'], autenticar, assincronoTratador(atualizarNotificacaoPorIdLer));
module.exports = router;
