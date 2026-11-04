const { Router } = require('express');
const { autenticar: autenticar, exigirFormacao } = require('../middleware/authentication.js');
const {
  obterQuestionarioAvaliacoes,
  atualizarQuestionarioAvaliacoesPorId,
  obterQuestionarioAulaPorAulaId,
  enviarQuestionarioPorQuestionarioIdSubmeter,
} = require('../controllers/quiz.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
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
