const { Router } = require('express');
const {
  autenticar: autenticar,
  autenticacaoOpcional: opcionalAutenticacao,
} = require('../intermediarios/autenticacao.js');
const {
  obterCursoMeusAprendizagem,
  enviarCursoPorCursoIdAlternarOcultar,
  obterCurso,
  obterCursoPorId,
  obterCursoPorIdColegas,
  enviarCursoPorIdInscrever,
  enviarCursoPorIdAulasPorAulaIdConcluir,
  enviarCursoPorCursoIdAvaliacoes,
} = require('../controladores/curso.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get(
  ['/minha-aprendizagem', '/my-learning'],
  autenticar,
  assincronoTratador(obterCursoMeusAprendizagem),
);
router.post(
  ['/:idCurso/alternar-visibilidade', '/:idCurso/toggle-hide'],
  autenticar,
  assincronoTratador(enviarCursoPorCursoIdAlternarOcultar),
);
router.get('/', opcionalAutenticacao, assincronoTratador(obterCurso));
router.get('/:id', opcionalAutenticacao, assincronoTratador(obterCursoPorId));
router.get(
  ['/:id/colegas', '/:id/classmates'],
  opcionalAutenticacao,
  assincronoTratador(obterCursoPorIdColegas),
);
router.post(
  ['/:id/inscrever', '/:id/enroll'],
  autenticar,
  assincronoTratador(enviarCursoPorIdInscrever),
);
router.post(
  ['/:id/aulas/:idAula/concluir', '/:id/lessons/:idAula/complete'],
  autenticar,
  assincronoTratador(enviarCursoPorIdAulasPorAulaIdConcluir),
);
router.post(
  ['/:idCurso/avaliacoes', '/:idCurso/reviews'],
  autenticar,
  assincronoTratador(enviarCursoPorCursoIdAvaliacoes),
);
module.exports = router;
