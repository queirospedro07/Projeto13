const { validarCursoBody } = require('../validation/content.js');
const { Router } = require('express');
const {
  autenticar: autenticar,
  exigirCargo: exigirCargo,
  exigirFormacao,
} = require('../middleware/authentication.js');
const {
  obterFormadorCandidaturaEstado,
  postCreatorCourseCommunity: enviarFormadorCursoCommunity,
  enviarFormadorCandidatar,
  obterFormadorEstatisticas,
  obterFormadorCursosPorCursoId,
  atualizarFormadorCursosPorCursoId,
  obterFormadorCursos,
  eliminarFormadorCursosPorCursoId,
  enviarFormadorCursos,
  obterFormadorMembros,
  obterFormadorCursosPorCursoIdColaboradores,
  enviarFormadorCursosPorCursoIdColaboradores,
  eliminarFormadorCursosPorCursoIdColaboradoresPorDestinoUtilizadorId,
  eliminarFormadorCursosPorCursoIdMembrosPorUtilizadorId,
  enviarFormadorCursosPorCursoIdInscricoes,
  enviarFormadorCursosPorCursoIdSubmeterRever,
} = require('../controllers/instructor.controller.js');
const { assincronoTratador } = require('../middleware/asyncHandler.js');
const router = Router();

router.post(
  ['/cursos/:idCurso/comunidade', '/courses/:idCurso/community'],
  autenticar,
  exigirFormacao,
  assincronoTratador(enviarFormadorCursoCommunity),
);

// Obter estado da candidatura a criador do utilizador autenticado
router.get(
  ['/estado-candidatura', '/application-status'],
  autenticar,
  assincronoTratador(obterFormadorCandidaturaEstado),
);

// Submeter inquérito de candidatura a criador / formador
router.post(['/candidatar', '/apply'], autenticar, assincronoTratador(enviarFormadorCandidatar));
router.get(
  ['/estatisticas', '/stats'],
  autenticar,
  exigirFormacao,
  assincronoTratador(obterFormadorEstatisticas),
);
router.get(
  ['/cursos/:idCurso', '/courses/:idCurso'],
  autenticar,
  exigirCargo('CREATOR', 'ADMIN'),
  assincronoTratador(obterFormadorCursosPorCursoId),
);
router.put(
  ['/cursos/:idCurso', '/courses/:idCurso'],
  autenticar,
  exigirFormacao,
  validarCursoBody,
  assincronoTratador(atualizarFormadorCursosPorCursoId),
);
router.get(
  ['/cursos', '/courses'],
  autenticar,
  exigirFormacao,
  assincronoTratador(obterFormadorCursos),
);
router.delete(
  ['/cursos/:idCurso', '/courses/:idCurso'],
  autenticar,
  exigirFormacao,
  assincronoTratador(eliminarFormadorCursosPorCursoId),
);
router.post(
  ['/cursos', '/courses'],
  autenticar,
  exigirFormacao,
  validarCursoBody,
  assincronoTratador(enviarFormadorCursos),
);
router.get(
  ['/membros', '/members'],
  autenticar,
  exigirFormacao,
  assincronoTratador(obterFormadorMembros),
);
router.get(
  ['/cursos/:idCurso/colaboradores', '/courses/:idCurso/collaborators'],
  autenticar,
  exigirFormacao,
  assincronoTratador(obterFormadorCursosPorCursoIdColaboradores),
);
router.post(
  ['/cursos/:idCurso/colaboradores', '/courses/:idCurso/collaborators'],
  autenticar,
  exigirFormacao,
  assincronoTratador(enviarFormadorCursosPorCursoIdColaboradores),
);
router.delete(
  ['/cursos/:idCurso/colaboradores/:targetUserId', '/courses/:idCurso/collaborators/:targetUserId'],
  autenticar,
  exigirFormacao,
  assincronoTratador(eliminarFormadorCursosPorCursoIdColaboradoresPorDestinoUtilizadorId),
);
router.delete(
  ['/cursos/:idCurso/membros/:idUtilizador', '/courses/:idCurso/members/:idUtilizador'],
  autenticar,
  exigirFormacao,
  assincronoTratador(eliminarFormadorCursosPorCursoIdMembrosPorUtilizadorId),
);
router.post(
  ['/cursos/:idCurso/inscricoes', '/courses/:idCurso/enrollments'],
  autenticar,
  exigirFormacao,
  assincronoTratador(enviarFormadorCursosPorCursoIdInscricoes),
);
router.post(
  ['/cursos/:idCurso/submeter-revisao', '/courses/:idCurso/submit-review'],
  autenticar,
  exigirFormacao,
  assincronoTratador(enviarFormadorCursosPorCursoIdSubmeterRever),
);
module.exports = router;
