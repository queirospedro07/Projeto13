const { Router } = require('express');
const { autenticar: autenticar, exigirFormacao } = require('../intermediarios/autenticacao.js');
const {
  obterQuestionarioAvaliacoes,
  atualizarQuestionarioAvaliacoesPorId,
  obterQuestionarioAulaPorAulaId,
  enviarQuestionarioPorQuestionarioIdSubmeter,
} = require('../controladores/questionario.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get(
  ['/avaliacoes', '/reviews'],
  autenticar,
  exigirFormacao,
  assincronoTratador(obterQuestionarioAvaliacoes),
);
router.put(
  ['/avaliacoes/:id', '/reviews/:id'],
  autenticar,
  exigirFormacao,
  assincronoTratador(atualizarQuestionarioAvaliacoesPorId),
);
router.get('/lesson/:idAula', autenticar, assincronoTratador(obterQuestionarioAulaPorAulaId));
router.post(
  ['/:idQuestionario/submeter', '/:idQuestionario/submit'],
  autenticar,
  assincronoTratador(enviarQuestionarioPorQuestionarioIdSubmeter),
);
module.exports = router;
