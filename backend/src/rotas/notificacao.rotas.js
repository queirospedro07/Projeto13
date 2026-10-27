const { Router } = require('express');
const { autenticar: autenticar } = require('../intermediarios/autenticacao.js');
const {
  obterNotificacao,
  atualizarNotificacaoLerTodos,
  atualizarNotificacaoPorIdLer,
} = require('../controladores/notificacao.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get('/', autenticar, assincronoTratador(obterNotificacao));
router.put(
  ['/ler-todas', '/read-all'],
  autenticar,
  assincronoTratador(atualizarNotificacaoLerTodos),
);
router.put(['/:id/ler', '/:id/read'], autenticar, assincronoTratador(atualizarNotificacaoPorIdLer));
module.exports = router;
