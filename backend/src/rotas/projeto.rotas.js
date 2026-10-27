const { Router } = require('express');
const { autenticar: autenticar, exigirFormacao } = require('../intermediarios/autenticacao.js');
const {
  obterProjetoAvaliacoes,
  atualizarProjetoAvaliacoesPorId,
  obterProjetoAulaPorId,
  enviarProjetoAulaPorId,
} = require('../controladores/projeto.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.use(autenticar);
router.get(['/avaliacoes', '/reviews'], exigirFormacao, assincronoTratador(obterProjetoAvaliacoes));
router.put(
  ['/avaliacoes/:id', '/reviews/:id'],
  exigirFormacao,
  assincronoTratador(atualizarProjetoAvaliacoesPorId),
);
router.get('/lesson/:id', assincronoTratador(obterProjetoAulaPorId));
router.post('/lesson/:id', assincronoTratador(enviarProjetoAulaPorId));
module.exports = router;
